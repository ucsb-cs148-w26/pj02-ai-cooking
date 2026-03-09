import { Ingredient, Recipe, UserPreferences } from "../types";

const RETRY_STATUS_MESSAGE = "Rate limited. Retrying with a different model...";

class RequestError extends Error {
  status: number;
  canRetry: boolean;

  constructor(message: string, status: number, canRetry = false) {
    super(message);
    this.status = status;
    this.canRetry = canRetry;
  }
}

const requestJson = async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const canRetry = response.status === 429 && Boolean(errorData?.canRetry);
    const message =
      errorData?.error ||
      (response.status === 429
        ? 'API rate limit reached. Please try again in a few minutes.'
        : `Request failed: ${response.statusText}`);
    throw new RequestError(message, response.status, canRetry);
  }

  return response.json() as Promise<T>;
};

const requestJsonStreaming = async <T>(
  url: string,
  body: Record<string, unknown>,
  onProgress: (message: string) => void,
  resultKey: 'items' | 'recipes'
): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, streamProgress: true })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const canRetry = response.status === 429 && Boolean(errorData?.canRetry);
    const message =
      errorData?.error ||
      (response.status === 429
        ? 'API rate limit reached. Please try again in a few minutes.'
        : `Request failed: ${response.statusText}`);
    throw new RequestError(message, response.status, canRetry);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new RequestError("No response body", 500, false);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line) as Record<string, unknown>;
        if (data.type === "progress" && typeof data.message === "string") {
          onProgress(data.message);
        } else if (data.type === "error") {
          const msg = typeof data.error === "string" ? data.error : "Request failed.";
          const canRetry = data.status === 429 && Boolean(data.canRetry);
          throw new RequestError(msg, (data.status as number) ?? 500, canRetry);
        } else if (resultKey in data) {
          result = data[resultKey] as T;
        }
      } catch (e) {
        if (e instanceof RequestError) throw e;
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer) as Record<string, unknown>;
      if (data.type === "progress" && typeof data.message === "string") {
        onProgress(data.message);
      } else if (data.type === "error") {
        const msg = typeof data.error === "string" ? data.error : "Request failed.";
        const canRetry = data.status === 429 && Boolean(data.canRetry);
        throw new RequestError(msg, (data.status as number) ?? 500, canRetry);
      } else if (resultKey in data) {
        result = data[resultKey] as T;
      }
    } catch (e) {
      if (e instanceof RequestError) throw e;
    }
  }

  if (result === null) {
    throw new RequestError("No result in stream", 500, false);
  }
  return result;
};

/**
 * Handles OCR and object detection for both food items and receipts.
 * Normalizes output into a standard Ingredient list.
 */
export const analyzeImage = async (
  base64Image: string,
  onStatus?: (msg: string) => void
): Promise<Ingredient[]> => {
  const doRequest = onStatus
    ? () =>
        requestJsonStreaming<Ingredient[]>(
          '/api/gemini/scan',
          { base64Image },
          onStatus,
          'items'
        )
    : () =>
        requestJson<{ items: Ingredient[] }>('/api/gemini/scan', { base64Image }).then(
          (d) => d.items ?? []
        );

  try {
    return await doRequest();
  } catch (error) {
    if (error instanceof RequestError && error.status === 429 && error.canRetry) {
      onStatus?.(RETRY_STATUS_MESSAGE);
      const retryDo = onStatus
        ? () =>
            requestJsonStreaming<Ingredient[]>(
              '/api/gemini/scan',
              { base64Image, useDowngradedModel: true },
              onStatus,
              'items'
            )
        : () =>
            requestJson<{ items: Ingredient[] }>('/api/gemini/scan', {
              base64Image,
              useDowngradedModel: true
            }).then((d) => d.items ?? []);
      return retryDo();
    }
    throw error;
  }
};

export const generateRecipes = async (
  ingredients: Ingredient[],
  preferences: Partial<UserPreferences>,
  onStatus?: (msg: string) => void
): Promise<Recipe[]> => {
  const body = { ingredients, preferences };
  const retryBody = { ingredients, preferences, useDowngradedModel: true };
  const doRequest = onStatus
    ? () =>
        requestJsonStreaming<Recipe[]>(
          '/api/gemini/recipes',
          body,
          onStatus,
          'recipes'
        )
    : () =>
        requestJson<{ recipes: Recipe[] }>('/api/gemini/recipes', body).then(
          (d) => d.recipes ?? []
        );

  try {
    return await doRequest();
  } catch (error) {
    if (error instanceof RequestError && error.status === 429 && error.canRetry) {
      onStatus?.(RETRY_STATUS_MESSAGE);
      const retryDo = onStatus
        ? () =>
            requestJsonStreaming<Recipe[]>(
              '/api/gemini/recipes',
              retryBody,
              onStatus,
              'recipes'
            )
        : () =>
            requestJson<{ recipes: Recipe[] }>('/api/gemini/recipes', retryBody).then(
              (d) => d.recipes ?? []
            );
      return retryDo();
    }
    throw error;
  }
};
