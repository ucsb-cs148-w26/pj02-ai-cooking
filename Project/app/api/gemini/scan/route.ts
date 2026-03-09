import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Ingredient } from '@/types';
import { getAllApiKeys, isRateLimitError, isUnavailableError } from '@/lib/geminiKeys';

const getImagePayload = (rawImage: string): { data: string; mimeType: string } => {
  const [prefix, data] = rawImage.split(',', 2);
  if (data) {
    const mimeTypeMatch = prefix.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
    return { mimeType: mimeTypeMatch?.[1] ?? 'image/jpeg', data };
  }

  return { mimeType: 'image/jpeg', data: rawImage };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PRIMARY_MODEL = 'gemini-3.1-flash-lite-preview';

// Fallback to a stable, older model if the preview endpoint fails
const DOWNGRADED_MODEL = 'gemini-2.5-flash';

// 4000ms aligns perfectly with the 15 RPM free tier limit (1 request / 4 seconds)
const KEY_RETRY_DELAY_MS = 4000;

const PROGRESS_ROTATING = 'Primary model busy, trying fallback model...';
const PROGRESS_NEXT_KEY = 'Trying next API key...';
const getScanMeta = (modelUsed: string, startedAt: number) => ({
  modelUsed,
  durationMs: Date.now() - startedAt
});

export async function POST(request: Request) {
  try {
    const startedAt = Date.now();
    const { base64Image, useDowngradedModel, streamProgress } = (await request.json()) as {
      base64Image?: string;
      useDowngradedModel?: boolean;
      streamProgress?: boolean;
    };

    if (!base64Image) {
      return NextResponse.json(
        { error: 'Missing base64Image.' },
        { status: 400 }
      );
    }

    const baseIngredientSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Common name of the food item' },
        quantity: { type: Type.STRING, description: "Estimated quantity/weight (e.g. '2', '1 lb')" },
        category: { type: Type.STRING, description: 'e.g. Produce, Dairy, Pantry' },
        expiryEstimate: { type: Type.STRING, description: "Shelf life estimate (e.g. '3 days', '2 weeks')." }
      },
      required: ['name', 'expiryEstimate']
    };

    const prompt =
      'Identify all food items visible in this image. The image may be a photo of food, a fridge, ' +
      'a grocery receipt, or a shopping list. For each food item, return its name, estimated quantity, ' +
      'category, and shelf-life estimate. Ignore non-food entries such as taxes, totals, and store info.';

    const schema = {
      type: Type.OBJECT,
      properties: {
        ingredients: {
          type: Type.ARRAY,
          items: baseIngredientSchema
        }
      }
    };

    const imagePayload = getImagePayload(base64Image);
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
                    contents: {
                      parts: [
                        { inlineData: imagePayload },
                        { text: prompt }
                      ]
                    },
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: schema
                    }
                  });
                  if (!response.text) {
                    enqueue({ items: [], meta: getScanMeta(modelsToTry[m], startedAt) });
                    return;
                  }
                  const parsed = JSON.parse(response.text);
                  enqueue({
                    items: parsed.ingredients || [],
                    meta: getScanMeta(modelsToTry[m], startedAt)
                  });
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
                  enqueue({ type: 'error', error: err instanceof Error ? err.message : 'Scan failed.' });
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
              enqueue({ type: 'error', error: lastError instanceof Error ? lastError.message : 'Scan failed.' });
            } else {
              enqueue({ items: [] });
            }
          } catch (error) {
            enqueue({ type: 'error', error: error instanceof Error ? error.message : 'Scan failed.' });
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
            contents: {
              parts: [
                { inlineData: imagePayload },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema
            }
          });

          if (!response.text) {
            return NextResponse.json({
              items: [] as Ingredient[],
              meta: getScanMeta(modelsToTry[m], startedAt)
            });
          }

          const parsed = JSON.parse(response.text);
          return NextResponse.json({
            items: parsed.ingredients || [],
            meta: getScanMeta(modelsToTry[m], startedAt)
          });
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

    return NextResponse.json({ items: [] as Ingredient[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
