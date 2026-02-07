import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Ingredient, Recipe, UserPreferences } from '@/types';

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  return key;
};

const generateRecipeImage = async (ai: GoogleGenAI, title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
    const { ingredients, preferences } = (await request.json()) as {
      ingredients?: Ingredient[];
      preferences?: Partial<UserPreferences>;
    };

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Missing ingredients.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const ingredientList = ingredients
      .map((i) => `${i.name} (${i.expiryEstimate || 'N/A'})`)
      .join(', ');

    const constraints = [
      preferences?.cuisine ? `Cuisine: ${preferences.cuisine}` : '',
      preferences?.restrictions ? `Restrictions: ${preferences.restrictions}` : '',
      'Prioritize ingredients expiring soon (short shelf life).'
    ]
      .filter(Boolean)
      .join('. ');

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
          difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          calories: { type: Type.NUMBER }
        },
        required: ['id', 'title', 'description', 'time', 'difficulty', 'ingredients', 'instructions']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) {
      return NextResponse.json({ recipes: [] as Recipe[] });
    }

    const recipes: Recipe[] = JSON.parse(response.text);
    const hydrated = await Promise.all(
      recipes.map(async (recipe) => ({
        ...recipe,
        image: await generateRecipeImage(ai, recipe.title)
      }))
    );

    return NextResponse.json({ recipes: hydrated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recipe generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
