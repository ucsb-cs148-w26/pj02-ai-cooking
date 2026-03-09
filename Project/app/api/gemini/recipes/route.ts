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
const PROGRESS_NEXT_KEY = 'Trying next API key...';

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

export async function POST(request: Request) {
  try {
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

    const ingredientList = ingredients
      .map((i) => `${i.name} (${i.expiryEstimate || 'N/A'})`)
      .join(', ');

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
      Ingredients available: ${ingredientList}.
      ${constraints.length > 0 ? `Constraints: ${constraints.join('. ')}.` : ''}
      Suggest 3 practical, delicious recipes that respect all dietary restrictions and allergies.
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
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                  const parsed = JSON.parse(response.text) as Recipe[];
                  const recipes: Recipe[] = Array.isArray(parsed) ? parsed : [];
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
                  enqueue({ recipes: hydrated });
                  return;
                } catch (err) {
                  lastError = err;
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

          const parsed = JSON.parse(response.text) as Recipe[];
          const recipes: Recipe[] = Array.isArray(parsed) ? parsed : [];
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

          return NextResponse.json({ recipes: hydrated });
        } catch (err) {
          lastError = err;

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