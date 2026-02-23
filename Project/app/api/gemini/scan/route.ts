import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Ingredient, ScanMode } from '@/types';

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  return key;
};

const getImagePayload = (rawImage: string): { data: string; mimeType: string } => {
  const [prefix, data] = rawImage.split(',', 2);
  if (data) {
    const mimeTypeMatch = prefix.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
    return { mimeType: mimeTypeMatch?.[1] ?? 'image/jpeg', data };
  }

  return { mimeType: 'image/jpeg', data: rawImage };
};

export async function POST(request: Request) {
  try {
    const { base64Image, mode } = (await request.json()) as {
      base64Image?: string;
      mode?: ScanMode;
    };

    if (!base64Image || !mode) {
      return NextResponse.json(
        { error: 'Missing base64Image or mode.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
      mode === 'food'
        ? 'Identify all food ingredients in this image. Return a JSON list with quantity and shelf life estimates.'
        : 'Extract food items from this receipt. Ignore taxes/totals. Estimate expiry based on food type (e.g. Milk = 1 week).';

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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
