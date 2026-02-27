import { Ingredient, Recipe, UserPreferences } from "../types";

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
    const message = errorData?.error || `Request failed: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

/**
 * Handles OCR and object detection for both food items and receipts.
 * Normalizes output into a standard Ingredient list.
 */
export const analyzeImage = async (
  base64Image: string
): Promise<Ingredient[]> => {
  const data = await requestJson<{ items: Ingredient[] }>('/api/gemini/scan', {
    base64Image
  });
  return data.items ?? [];
};

export const generateRecipes = async (
  ingredients: Ingredient[],
  preferences: Partial<UserPreferences>
): Promise<Recipe[]> => {
  const data = await requestJson<{ recipes: Recipe[] }>('/api/gemini/recipes', {
    ingredients,
    preferences
  });
  return data.recipes ?? [];
};
