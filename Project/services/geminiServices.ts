import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe, ScanMode, UserPreferences } from "../types";

// Initialize the client with the environment variable API Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Handles object detection (food) and OCR (receipts).
 * Normalizes output into a standard Ingredient list structure.
 */
export const analyzeImage = async (base64Image: string, mimeType: string, mode: ScanMode): Promise<Ingredient[]> => {
  const prompt = mode === 'food' 
    ? "Analyze this image of food/ingredients. Identify every distinct edible item. Return a JSON object with a list of ingredients. For each, estimate quantity, category, and expiry (e.g. '7 days' for produce, '2 weeks' for dairy)." 
    : "Extract food items from this receipt image. Ignore taxes and totals. Return a JSON object with a list of ingredients. Estimate expiry based on the food type.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  category: { type: Type.STRING },
                  expiryEstimate: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) return [];
    const parsed = JSON.parse(response.text);
    return parsed.ingredients || [];
  } catch (error) {
    console.error("Gemini analysis service failed:", error);
    return [];
  }
};

/**
 * Generates a photorealistic image for a recipe using the Nano Banana model.
 */
const WB_generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional food photography of ${title}, appetizing, realistic, high quality, 4k, studio lighting.` }],
      },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
  } catch (error) {
    console.warn("Image generation failed silently:", error);
  }
  return "";
};

export const generateRecipes = async (ingredients: Ingredient[], preferences: UserPreferences): Promise<Recipe[]> => {
  const ingredientList = ingredients
    .map(i => `${i.name} (${i.expiryEstimate || 'unknown expiry'})`)
    .join(', ');
  
  const constraints = [
    preferences.cuisine ? `Cuisine style: ${preferences.cuisine}` : '',
    preferences.restrictions ? `Dietary restrictions: ${preferences.restrictions}` : '',
    "Prioritize using ingredients that are expiring soon."
  ].filter(Boolean).join('. ');

  const prompt = `
    You are a Michelin Star Chef.
    Available Ingredients: ${ingredientList}.
    Constraints: ${constraints}.
    
    Create 3 unique, practical, and delicious recipes using these ingredients. You can assume basic pantry staples (salt, pepper, oil) are available.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a creative chef. Output strict JSON.",
        responseMimeType: "application/json",
        responseSchema: {
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
            required: ["id", "title", "description", "time", "difficulty", "ingredients", "instructions", "calories"]
          }
        }
      }
    });

    if (!response.text) throw new Error("Empty response from recipe generator");

    const recipes: Recipe[] = JSON.parse(response.text);

    // Hydrate recipes with images in parallel
    const recipesWithImages = await Promise.all(recipes.map(async (recipe) => ({
      ...recipe,
      image: await WB_generateRecipeImage(recipe.title)
    })));

    return recipesWithImages;

  } catch (error) {
    console.error("Recipe generation service failed:", error);
    return [];
  }
};