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

const requestJson = async <T>(url: string, body: unknown): Promise<T> => {
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

/**
 * Handles OCR and object detection for both food items and receipts.
 * Normalizes output into a standard Ingredient list.
 */
export const analyzeImage = async (
  base64Image: string,
  onStatus?: (msg: string) => void
): Promise<Ingredient[]> => {
  try {
    const data = await requestJson<{ items: Ingredient[] }>('/api/gemini/scan', {
      base64Image
    });
    return data.items ?? [];
  } catch (error) {
    if (error instanceof RequestError && error.status === 429 && error.canRetry) {
      onStatus?.(RETRY_STATUS_MESSAGE);
      const retryData = await requestJson<{ items: Ingredient[] }>('/api/gemini/scan', {
        base64Image,
        useDowngradedModel: true
      });
      return retryData.items ?? [];
    }
    throw error;
  }
};

export const generateRecipes = async (
  ingredients: Ingredient[],
  preferences: Partial<UserPreferences>,
  onStatus?: (msg: string) => void
): Promise<Recipe[]> => {
  try {
    const data = await requestJson<{ recipes: Recipe[] }>('/api/gemini/recipes', {
      ingredients,
      preferences
    });
    return data.recipes ?? [];
  } catch (error) {
    if (error instanceof RequestError && error.status === 429 && error.canRetry) {
      onStatus?.(RETRY_STATUS_MESSAGE);
      const retryData = await requestJson<{ recipes: Recipe[] }>('/api/gemini/recipes', {
        ingredients,
        preferences,
        useDowngradedModel: true
      });
      return retryData.recipes ?? [];
    }
    throw error;
  }
};
