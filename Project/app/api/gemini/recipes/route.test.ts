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
    ingredients: ['egg'],
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
