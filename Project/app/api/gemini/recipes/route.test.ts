import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const PRIMARY_MODEL = 'gemini-3.1-flash-lite-preview';
const DOWNGRADED_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

const mockRecipes = [
  {
    id: '1',
    title: 'Test Recipe',
    description: 'A test',
    time: '10 min',
    difficulty: 'Easy' as const,
    ingredients: [
      {
        quantityText: '2',
        name: 'eggs',
        source: 'pantry' as const
      }
    ],
    instructions: ['Cook it']
  }
];

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn()
}));

vi.mock('@/lib/geminiKeys', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/geminiKeys')>();
  return {
    ...actual,
    getAllApiKeys: () => ['test-key']
  };
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function (this: unknown) {
    return {
      models: {
        generateContent: generateContentMock
      }
    };
  }),
  Type: { ARRAY: 'array', OBJECT: 'object', STRING: 'string', NUMBER: 'number' }
}));

describe('POST /api/gemini/recipes - 503 model downgrade', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
  });

  it('downgrades to fallback model when primary returns 503, then succeeds', async () => {
    const err503 = new Error(
      '503 UNAVAILABLE: This model is currently experiencing high demand. Spikes in demand are usually temporary.'
    );

    generateContentMock.mockImplementation(async (args: { model?: string }) => {
      if (args.model === PRIMARY_MODEL) {
        throw err503;
      }
      if (args.model === DOWNGRADED_MODEL) {
        return { text: JSON.stringify(mockRecipes) };
      }
      if (args.model === IMAGE_MODEL) {
        return { candidates: [{ content: { parts: [] } }] };
      }
      throw new Error(`Unexpected model: ${args.model}`);
    });

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'egg', expiryEstimate: '3 days' }],
        useDowngradedModel: false
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recipes).toHaveLength(1);
    expect(data.recipes[0].title).toBe('Test Recipe');
    expect(data.recipes[0].ingredients).toEqual(['2 eggs']);

    const primaryCalls = generateContentMock.mock.calls.filter((c) => c[0]?.model === PRIMARY_MODEL);
    const downgradedCalls = generateContentMock.mock.calls.filter(
      (c) => c[0]?.model === DOWNGRADED_MODEL
    );
    expect(primaryCalls).toHaveLength(1);
    expect(downgradedCalls).toHaveLength(1);
  });

  it('returns 429 with canRetry when both models return 503 on single key', async () => {
    const err503 = new Error('503 UNAVAILABLE: high demand');

    generateContentMock.mockRejectedValue(err503);

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'egg', expiryEstimate: '3 days' }],
        useDowngradedModel: false
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toContain('temporarily unavailable');
    expect(data.canRetry).toBe(true);
  });

  it('falls back when primary returns a non-pantry ingredient', async () => {
    const invalidPrimaryRecipes = [
      {
        ...mockRecipes[0],
        ingredients: [
          {
            quantityText: '1 can',
            name: 'coconut milk',
            source: 'pantry' as const
          }
        ]
      }
    ];

    generateContentMock.mockImplementation(async (args: { model?: string }) => {
      if (args.model === PRIMARY_MODEL) {
        return { text: JSON.stringify(invalidPrimaryRecipes) };
      }
      if (args.model === DOWNGRADED_MODEL) {
        return { text: JSON.stringify(mockRecipes) };
      }
      if (args.model === IMAGE_MODEL) {
        return { candidates: [{ content: { parts: [] } }] };
      }
      throw new Error(`Unexpected model: ${args.model}`);
    });

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'egg', quantity: '6', expiryEstimate: '3 days' }],
        useDowngradedModel: false
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recipes).toHaveLength(1);
    expect(data.recipes[0].ingredients).toEqual(['2 eggs']);

    const primaryCalls = generateContentMock.mock.calls.filter((c) => c[0]?.model === PRIMARY_MODEL);
    const downgradedCalls = generateContentMock.mock.calls.filter(
      (c) => c[0]?.model === DOWNGRADED_MODEL
    );
    expect(primaryCalls).toHaveLength(1);
    expect(downgradedCalls).toHaveLength(1);
  });

  it('keeps valid recipes and filters out ones with non-pantry ingredients', async () => {
    const mixedRecipes = [
      {
        id: '1',
        title: 'Good Recipe',
        description: 'Uses pantry items',
        time: '10 min',
        difficulty: 'Easy' as const,
        ingredients: [
          { quantityText: '2', name: 'eggs', source: 'pantry' as const }
        ],
        instructions: ['Cook it']
      },
      {
        id: '2',
        title: 'Bad Recipe',
        description: 'Invents coconut milk',
        time: '20 min',
        difficulty: 'Medium' as const,
        ingredients: [
          { quantityText: '1 can', name: 'coconut milk', source: 'pantry' as const }
        ],
        instructions: ['Pour it']
      }
    ];

    generateContentMock.mockImplementation(async (args: { model?: string }) => {
      if (args.model === PRIMARY_MODEL) {
        return { text: JSON.stringify(mixedRecipes) };
      }
      if (args.model === IMAGE_MODEL) {
        return { candidates: [{ content: { parts: [] } }] };
      }
      throw new Error(`Unexpected model: ${args.model}`);
    });

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'egg', quantity: '6', expiryEstimate: '3 days' }],
        useDowngradedModel: false
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recipes).toHaveLength(1);
    expect(data.recipes[0].title).toBe('Good Recipe');

    const downgradedCalls = generateContentMock.mock.calls.filter(
      (c) => c[0]?.model === DOWNGRADED_MODEL
    );
    expect(downgradedCalls).toHaveLength(0);
  });

  it('accepts fuzzy pantry name matches like "chicken breast" for pantry item "Chicken"', async () => {
    const fuzzyRecipes = [
      {
        id: '1',
        title: 'Chicken Dish',
        description: 'Uses chicken',
        time: '30 min',
        difficulty: 'Medium' as const,
        ingredients: [
          { quantityText: '500 g', name: 'chicken breast', source: 'pantry' as const },
          { quantityText: '1/2 tsp', name: 'salt', source: 'assumed_spice' as const }
        ],
        instructions: ['Cook the chicken']
      }
    ];

    generateContentMock.mockImplementation(async (args: { model?: string }) => {
      if (args.model === PRIMARY_MODEL) {
        return { text: JSON.stringify(fuzzyRecipes) };
      }
      if (args.model === IMAGE_MODEL) {
        return { candidates: [{ content: { parts: [] } }] };
      }
      throw new Error(`Unexpected model: ${args.model}`);
    });

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'Chicken', quantity: '2 kg', expiryEstimate: '5 days' }],
        useDowngradedModel: false
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recipes).toHaveLength(1);
    expect(data.recipes[0].ingredients).toEqual(['500 g chicken breast', '1/2 tsp salt']);
  });

  it('returns 429 without canRetry when already using downgraded model and it 503s', async () => {
    const err503 = new Error('503 UNAVAILABLE: high demand');

    generateContentMock.mockRejectedValue(err503);

    const req = new Request('http://test/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: 'egg', expiryEstimate: '3 days' }],
        useDowngradedModel: true
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.canRetry).toBe(false);
  });
});
