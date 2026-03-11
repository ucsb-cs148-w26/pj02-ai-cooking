import { Ingredient, Recipe, ScanAnalysisMeta, ScanAnalysisResult, UserPreferences } from "../types";

const RETRY_STATUS_MESSAGE = "Rate limited. Retrying with a different model...";

type StreamResult<T> = {
  value: T;
  meta?: ScanAnalysisMeta;
};

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
): Promise<StreamResult<T>> => {
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
  let result: StreamResult<T> | null = null;

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
          result = {
            value: data[resultKey] as T,
            meta: data.meta as ScanAnalysisMeta | undefined
          };
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
        result = {
          value: data[resultKey] as T,
          meta: data.meta as ScanAnalysisMeta | undefined
        };
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
): Promise<ScanAnalysisResult> => {
  if (onStatus) {
    try {
      const result = await requestJsonStreaming<Ingredient[]>(
        '/api/gemini/scan',
        { base64Image },
        onStatus,
        'items'
      );
      return {
        items: result.value,
        meta: result.meta
      };
    } catch (error) {
      if (error instanceof RequestError && error.status === 429 && error.canRetry) {
        onStatus(RETRY_STATUS_MESSAGE);
        const retryResult = await requestJsonStreaming<Ingredient[]>(
          '/api/gemini/scan',
          { base64Image, useDowngradedModel: true },
          onStatus,
          'items'
        );
        return {
          items: retryResult.value,
          meta: retryResult.meta
        };
      }
      throw error;
    }
  }

  try {
    const result = await requestJson<ScanAnalysisResult>('/api/gemini/scan', { base64Image });
    return {
      items: result.items ?? [],
      meta: result.meta
    };
  } catch (error) {
    if (error instanceof RequestError && error.status === 429 && error.canRetry) {
      const retryResult = await requestJson<ScanAnalysisResult>('/api/gemini/scan', {
        base64Image,
        useDowngradedModel: true
      });
      return {
        items: retryResult.items ?? [],
        meta: retryResult.meta
      };
    }
    throw error;
  }
};

export type GenerateRecipesResult = {
  recipes: Recipe[];
  meta?: ScanAnalysisMeta;
};

export const generateRecipes = async (
  ingredients: Ingredient[],
  preferences: Partial<UserPreferences>,
  onStatus?: (msg: string) => void
): Promise<GenerateRecipesResult> => {
  const body = { ingredients, preferences };
  const retryBody = { ingredients, preferences, useDowngradedModel: true };
  const doRequest = onStatus
    ? () =>
        requestJsonStreaming<Recipe[]>(
          '/api/gemini/recipes',
          body,
          onStatus,
          'recipes'
        ).then((result) => ({ recipes: result.value, meta: result.meta }))
    : () =>
        requestJson<{ recipes: Recipe[]; meta?: ScanAnalysisMeta }>('/api/gemini/recipes', body).then(
          (d) => ({ recipes: d.recipes ?? [], meta: d.meta })
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
            ).then((result) => ({ recipes: result.value, meta: result.meta }))
        : () =>
            requestJson<{ recipes: Recipe[]; meta?: ScanAnalysisMeta }>('/api/gemini/recipes', retryBody).then(
              (d) => ({ recipes: d.recipes ?? [], meta: d.meta })
            );
      return retryDo();
    }
    throw error;
  }
};
