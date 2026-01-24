import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe, ScanMode, UserPreferences } from "../types";

const LOCAL_STORAGE_KEY = 'gemini_api_key';

export const getApiKey = (): string | undefined => {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || undefined;
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, key);
};

export const removeStoredApiKey = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};

export const hasValidApiKey = (): boolean => {
  return !!getApiKey();
};

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing via getAIClient");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Handles OCR and object detection for both food items and receipts.
 * Normalizes output into a standard Ingredient list.
 */
export const analyzeImage = async (base64Image: string, mode: ScanMode): Promise<Ingredient[]> => {
  const ai = getAIClient();
  
  // Define schema for consistent JSON output across both modes
  const baseIngredientSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Common name of the food item" },
      quantity: { type: Type.STRING, description: "Estimated quantity/weight (e.g. '2', '1 lb')" },
      category: { type: Type.STRING, description: "e.g. Produce, Dairy, Pantry" },
      expiryEstimate: { type: Type.STRING, description: "Shelf life estimate (e.g. '3 days', '2 weeks'). Infer from item type if scanning receipt." },
    },
    required: ["name", "expiryEstimate"]
  };

  let prompt = "";
  
  if (mode === 'food') {
    prompt = "Identify all food ingredients in this image. Return a JSON list with quantity and shelf life estimates.";
  } else {
    prompt = "Extract food items from this receipt. Ignore taxes/totals. Estimate expiry based on food type (e.g. Milk = 1 week).";
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      ingredients: {
        type: Type.ARRAY,
        items: baseIngredientSchema
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) return [];

    const parsed = JSON.parse(response.text);
    return parsed.ingredients || [];

  } catch (error) {
    console.error("Analysis failed:", error);
    return [];
  }
};

const generateRecipeImage = async (title: string): Promise<string> => {
  const ai = getAIClient();
  try {
    // Using 2.5-flash-image for speed/cost efficiency
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional food photography of ${title}, appetizing, realistic, high quality, 4k.` }],
      },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    // Extract raw base64 from inlineData
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return "";
};

export const generateRecipes = async (ingredients: Ingredient[], preferences: UserPreferences): Promise<Recipe[]> => {
  const ai = getAIClient();
  
  const ingredientList = ingredients
    .map(i => `${i.name} (${i.expiryEstimate || 'N/A'})`)
    .join(', ');
  
  const constraints = [
    preferences.cuisine ? `Cuisine: ${preferences.cuisine}` : '',
    preferences.restrictions ? `Restrictions: ${preferences.restrictions}` : '',
    "Prioritize ingredients expiring soon (short shelf life)."
  ].filter(Boolean).join('. ');

  const prompt = `
    Ingredients available: ${ingredientList}.
    Constraints: ${constraints}.
    Suggest 3 practical, delicious recipes.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        time: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        calories: { type: Type.NUMBER }
      },
      required: ["id", "title", "description", "time", "difficulty", "ingredients", "instructions"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("Empty response from recipe generator");

    const recipes: Recipe[] = JSON.parse(response.text);

    // Hydrate recipes with generated images in parallel
    return await Promise.all(recipes.map(async (recipe) => ({
      ...recipe,
      image: await generateRecipeImage(recipe.title)
    })));

  } catch (error) {
    console.error("Recipe generation failed:", error);
    return [];
  }
};
