import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Ingredient } from '@/types';
import { getAllApiKeys, isRateLimitError } from '@/lib/geminiKeys';

const getImagePayload = (rawImage: string): { data: string; mimeType: string } => {
  const [prefix, data] = rawImage.split(',', 2);
  if (data) {
    const mimeTypeMatch = prefix.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
    return { mimeType: mimeTypeMatch?.[1] ?? 'image/jpeg', data };
  }

  return { mimeType: 'image/jpeg', data: rawImage };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PRIMARY_MODEL = 'gemini-2.5-flash';
const DOWNGRADED_MODEL = 'gemini-2.0-flash';
const KEY_RETRY_DELAY_MS = 1000;

export async function POST(request: Request) {
  try {
    const { base64Image, useDowngradedModel } = (await request.json()) as {
      base64Image?: string;
      useDowngradedModel?: boolean;
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
    const model = useDowngradedModel ? DOWNGRADED_MODEL : PRIMARY_MODEL;
    const apiKeys = getAllApiKeys();
    let lastError: unknown;
    let rateLimitHit = false;

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
      const ai = new GoogleGenAI({ apiKey: apiKeys[keyIndex] });
      try {
        const response = await ai.models.generateContent({
          model,
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
          return NextResponse.json({ items: [] as Ingredient[] });
        }

        const parsed = JSON.parse(response.text);
        return NextResponse.json({ items: parsed.ingredients || [] });
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err)) {
          rateLimitHit = true;
          if (keyIndex < apiKeys.length - 1) {
            await sleep(KEY_RETRY_DELAY_MS);
          }
          continue;
        } else {
          throw err;
        }
      }
    }

    if (rateLimitHit) {
      const canRetry = !useDowngradedModel;
      return NextResponse.json(
        {
          error: canRetry
            ? 'API rate limit reached. We will try again with a fallback model.'
            : 'API rate limit reached. Please try again in a few minutes.',
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
