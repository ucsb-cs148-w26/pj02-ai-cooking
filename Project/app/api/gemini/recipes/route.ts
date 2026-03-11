import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Ingredient, Recipe, UserPreferences } from '@/types';
import { getAllApiKeys, isRateLimitError, isUnavailableError } from '@/lib/geminiKeys';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PRIMARY_MODEL = 'gemini-3.1-flash-lite-preview';

// Fallback to a stable, older model if the preview endpoint fails
const DOWNGRADED_MODEL = 'gemini-2.5-flash';

// 4000ms aligns perfectly with the 15 RPM free tier limit (1 request / 4 seconds)
const KEY_RETRY_DELAY_MS = 4000;

const PROGRESS_ROTATING = 'Primary model busy, trying fallback model...';
const PROGRESS_INVALID_FORMAT = 'Recipe output was incomplete, trying fallback model...';
const PROGRESS_NEXT_KEY = 'Trying next API key...';

const BASIC_ASSUMED_SPICES = [
  'salt',
  'black pepper',
  'garlic powder',
  'onion powder',
  'paprika',
  'smoked paprika',
  'cumin',
  'chili powder',
  'cayenne',
  'dried oregano',
  'oregano',
  'dried basil',
  'basil',
  'dried thyme',
  'thyme',
  'rosemary',
  'red pepper flakes',
  'chili flakes',
  'cinnamon',
  'nutmeg',
  'turmeric',
  'curry powder'
] as const;

const QUANTITY_TEXT_RE = /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s+[a-zA-Z]+)?$/;

type GeneratedIngredient = {
  quantityText: string;
  name: string;
  source: 'pantry' | 'assumed_spice';
};

type GeneratedRecipe = Omit<Recipe, 'ingredients' | 'image'> & {
  ingredients: GeneratedIngredient[];
};

class RecipeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeValidationError';
  }
}

const singularizeToken = (token: string) => {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('oes') && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
};

const normalizeIngredientName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeToken)
    .join(' ');

const formatPantryItem = (ingredient: Ingredient) => {
  const name = ingredient.name.trim();
  const details: string[] = [];

  if (ingredient.quantity?.trim()) {
    details.push(`quantity: ${ingredient.quantity.trim()}`);
  }
  if (ingredient.expiryEstimate?.trim()) {
    details.push(`expiry: ${ingredient.expiryEstimate.trim()}`);
  }

  return `- ${name}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
};

const toRecipeList = (generatedRecipes: GeneratedRecipe[], pantryIngredients: Ingredient[]): Recipe[] => {
  const pantryNames = new Set(
    pantryIngredients
      .map((ingredient) => normalizeIngredientName(ingredient.name))
      .filter(Boolean)
  );
  const allowedSpices = new Set(
    BASIC_ASSUMED_SPICES.map((spice) => normalizeIngredientName(spice))
  );

  return generatedRecipes.map((recipe, recipeIndex) => {
    const recipeLabel = recipe.title?.trim() || `Recipe ${recipeIndex + 1}`;

    if (!Array.isArray(recipe.ingredients)) {
      throw new RecipeValidationError(`${recipeLabel} returned an invalid ingredient list.`);
    }

    const ingredients = recipe.ingredients.map((ingredient, ingredientIndex) => {
      const quantityText = ingredient?.quantityText?.trim();
      const name = ingredient?.name?.trim();
      const source = ingredient?.source;
      const label = `${recipeLabel} ingredient ${ingredientIndex + 1}`;

      if (!quantityText || !QUANTITY_TEXT_RE.test(quantityText)) {
        throw new RecipeValidationError(`${label} is missing a valid quantity or unit/count.`);
      }

      if (!name) {
        throw new RecipeValidationError(`${label} is missing an ingredient name.`);
      }

      const normalizedName = normalizeIngredientName(name);
      if (!normalizedName) {
        throw new RecipeValidationError(`${label} is empty after normalization.`);
      }

      if (source === 'pantry') {
        if (!pantryNames.has(normalizedName)) {
          throw new RecipeValidationError(`${recipeLabel} used non-pantry ingredient "${name}".`);
        }
      } else if (source === 'assumed_spice') {
        if (!allowedSpices.has(normalizedName)) {
          throw new RecipeValidationError(`${recipeLabel} assumed non-spice ingredient "${name}".`);
        }
      } else {
        throw new RecipeValidationError(`${label} has an invalid source.`);
      }

      return `${quantityText} ${name}`.replace(/\s+/g, ' ').trim();
    });

    return {
      ...recipe,
      ingredients
    };
  });
};

const parseGeneratedRecipes = (responseText: string, pantryIngredients: Ingredient[]) => {
  const parsed = JSON.parse(responseText) as GeneratedRecipe[];
  if (!Array.isArray(parsed)) {
    throw new RecipeValidationError('Recipe response was not an array.');
  }
  return toRecipeList(parsed, pantryIngredients);
};

const generateRecipeImage = async (ai: GoogleGenAI, title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: `Professional food photography of ${title}, appetizing, realistic, high quality, 4k.` }]
      },
      config: {
        imageConfig: { aspectRatio: '4:3' }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data?: string } }) => p.inlineData
    );
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (error) {
    console.error('Image generation failed:', error);
  }
  return '';
};

const getRecipeMeta = (modelUsed: string, startedAt: number) => ({
  modelUsed,
  durationMs: Date.now() - startedAt
});

export async function POST(request: Request) {
  try {
    const startedAt = Date.now();
    const { ingredients, preferences, useDowngradedModel, streamProgress } = (await request.json()) as {
      ingredients?: Ingredient[];
      preferences?: Partial<UserPreferences>;
      useDowngradedModel?: boolean;
      streamProgress?: boolean;
    };

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Missing ingredients.' },
        { status: 400 }
      );
    }

    const ingredientList = ingredients.map(formatPantryItem).join('\n');

    const constraints: string[] = [];

    if (preferences?.cuisine) {
      constraints.push(`Preferred cuisine: ${preferences.cuisine}`);
    } else if (preferences?.cuisinePreferences?.length) {
      constraints.push(`Preferred cuisines: ${preferences.cuisinePreferences.join(', ')}`);
    }

    if (preferences?.restrictions) {
      constraints.push(`Dietary restrictions: ${preferences.restrictions}`);
    }

    if (preferences?.dietType && preferences.dietType !== 'None') {
      constraints.push(`Diet type: ${preferences.dietType}`);
    }

    if (preferences?.allergies?.length) {
      const allAllergies = preferences.customAllergies
        ? [...preferences.allergies, preferences.customAllergies]
        : preferences.allergies;
      constraints.push(`Allergies (MUST AVOID these ingredients): ${allAllergies.join(', ')}`);
    }

    if (preferences?.cookingSkillLevel) {
      constraints.push(`Cooking skill level: ${preferences.cookingSkillLevel} (adjust recipe complexity accordingly)`);
    }

    constraints.push('Prioritize ingredients expiring soon (short shelf life).');

    const prompt = `
      You are generating recipes from a user's pantry.
      Available pantry items:
      ${ingredientList}
      ${constraints.length > 0 ? `Constraints: ${constraints.join('. ')}.` : ''}
      Suggest 3 practical, delicious recipes that respect all dietary restrictions and allergies.
      Rules:
      - Use pantry ingredients for every non-spice ingredient.
      - You may assume only basic spices or dried seasonings in small amounts: ${BASIC_ASSUMED_SPICES.join(', ')}.
      - Do not assume any other ingredient unless it appears in the pantry list above. This includes coconut milk, broth, butter, oil, cheese, onions, garlic cloves, sauces, produce, canned goods, or other pantry staples not listed.
      - If the pantry is sparse, keep the recipe simple instead of inventing extra ingredients.
      - Do not use more of a pantry ingredient than the listed quantity reasonably supports.
      - Every ingredient must include an explicit leading quantity. Never output an ingredient without a quantity.
      - quantityText must contain only the amount/unit part, such as "2", "1 can", "1/2 tsp", or "200 g".
      - name must contain only the ingredient name, such as "eggs", "coconut milk", or "salt".
      - source must be "pantry" for pantry ingredients and "assumed_spice" only for the allowed spices above.
      - Keep pantry ingredient names aligned with the pantry items above so they can be matched back to the pantry.
      - Instructions must not mention ingredients that are missing from the ingredient list.
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
          difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                quantityText: { type: Type.STRING },
                name: { type: Type.STRING },
                source: { type: Type.STRING, enum: ['pantry', 'assumed_spice'] }
              },
              required: ['quantityText', 'name', 'source']
            }
          },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          calories: { type: Type.NUMBER }
        },
        required: ['id', 'title', 'description', 'time', 'difficulty', 'ingredients', 'instructions']
      }
    };

    const modelsToTry = useDowngradedModel
      ? [DOWNGRADED_MODEL]
      : [PRIMARY_MODEL, DOWNGRADED_MODEL];
    const apiKeys = getAllApiKeys();
    let lastError: unknown;
    let retryableHit = false;

    if (streamProgress) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const enqueue = (obj: object) => {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          };
          try {
            for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
              const ai = new GoogleGenAI({ apiKey: apiKeys[keyIndex] });
              for (let m = 0; m < modelsToTry.length; m++) {
                try {
                  const response = await ai.models.generateContent({
                    model: modelsToTry[m],
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: schema
                    }
                  });
                  if (!response.text) {
                    enqueue({ recipes: [] });
                    return;
                  }
                  const recipes = parseGeneratedRecipes(response.text, ingredients);
                  const hydrated = await Promise.all(
                    recipes.map(async (recipe, index) => {
                      const id = recipe?.id && String(recipe.id).trim()
                        ? String(recipe.id).trim()
                        : `recipe-${index}-${Date.now()}`;
                      return {
                        ...recipe,
                        id,
                        image: await generateRecipeImage(ai, recipe.title)
                      };
                    })
                  );
                  enqueue({ recipes: hydrated, meta: getRecipeMeta(modelsToTry[m], startedAt) });
                  return;
                } catch (err) {
                  lastError = err;
                  if (err instanceof RecipeValidationError) {
                    if (m < modelsToTry.length - 1) {
                      enqueue({ type: 'progress', message: PROGRESS_INVALID_FORMAT });
                      continue;
                    }
                    if (keyIndex < apiKeys.length - 1) {
                      enqueue({ type: 'progress', message: PROGRESS_NEXT_KEY });
                      break;
                    }
                    enqueue({ type: 'error', error: err.message });
                    return;
                  }
                  if (isUnavailableError(err) && m < modelsToTry.length - 1) {
                    enqueue({ type: 'progress', message: PROGRESS_ROTATING });
                    continue;
                  }
                  if (isRateLimitError(err)) {
                    retryableHit = true;
                    if (keyIndex < apiKeys.length - 1) {
                      enqueue({ type: 'progress', message: PROGRESS_NEXT_KEY });
                      await sleep(KEY_RETRY_DELAY_MS);
                    }
                    break;
                  }
                  if (isUnavailableError(err)) {
                    retryableHit = true;
                    if (keyIndex < apiKeys.length - 1) {
                      enqueue({ type: 'progress', message: PROGRESS_NEXT_KEY });
                    }
                    break;
                  }
                  enqueue({ type: 'error', error: err instanceof Error ? err.message : 'Recipe generation failed.' });
                  return;
                }
              }
            }
            if (retryableHit) {
              const canRetry = !useDowngradedModel;
              enqueue({
                type: 'error',
                error: canRetry
                  ? 'Model temporarily unavailable. We will try again with a fallback model.'
                  : 'Model temporarily unavailable. Please try again in a few minutes.',
                status: 429,
                canRetry
              });
            } else if (lastError !== undefined) {
              enqueue({ type: 'error', error: lastError instanceof Error ? lastError.message : 'Recipe generation failed.' });
            } else {
              enqueue({ recipes: [] });
            }
          } catch (error) {
            enqueue({ type: 'error', error: error instanceof Error ? error.message : 'Recipe generation failed.' });
          } finally {
            controller.close();
          }
        }
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'application/x-ndjson' }
      });
    }

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
      const ai = new GoogleGenAI({ apiKey: apiKeys[keyIndex] });

      for (let m = 0; m < modelsToTry.length; m++) {
        try {
          const response = await ai.models.generateContent({
            model: modelsToTry[m],
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema
            }
          });

          if (!response.text) {
            return NextResponse.json({ recipes: [] as Recipe[] });
          }

          const recipes = parseGeneratedRecipes(response.text, ingredients);
          const hydrated = await Promise.all(
            recipes.map(async (recipe, index) => {
              const id = recipe?.id && String(recipe.id).trim()
                ? String(recipe.id).trim()
                : `recipe-${index}-${Date.now()}`;
              return {
                ...recipe,
                id,
                image: await generateRecipeImage(ai, recipe.title)
              };
            })
          );

          return NextResponse.json({ recipes: hydrated, meta: getRecipeMeta(modelsToTry[m], startedAt) });
        } catch (err) {
          lastError = err;

          if (err instanceof RecipeValidationError) {
            if (m < modelsToTry.length - 1) {
              continue;
            }
            if (keyIndex < apiKeys.length - 1) {
              break;
            }
            throw err;
          }

          if (isUnavailableError(err) && m < modelsToTry.length - 1) {
            continue;
          }

          if (isRateLimitError(err)) {
            retryableHit = true;
            if (keyIndex < apiKeys.length - 1) {
              await sleep(KEY_RETRY_DELAY_MS);
            }
            break;
          }
          if (isUnavailableError(err)) {
            retryableHit = true;
            break;
          }

          throw err;
        }
      }
    }

    if (retryableHit) {
      const canRetry = !useDowngradedModel;
      return NextResponse.json(
        {
          error: canRetry
            ? 'Model temporarily unavailable. We will try again with a fallback model.'
            : 'Model temporarily unavailable. Please try again in a few minutes.',
          canRetry
        },
        { status: 429 }
      );
    }

    if (lastError !== undefined) {
      throw lastError;
    }

    return NextResponse.json({ recipes: [] as Recipe[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recipe generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}