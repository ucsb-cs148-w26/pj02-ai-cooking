const addUniqueKey = (keys: string[], candidate?: string) => {
  if (!candidate) {
    return;
  }

  const normalized = candidate.trim();
  if (!normalized || keys.includes(normalized)) {
    return;
  }

  keys.push(normalized);
};

export const getAllApiKeys = (): string[] => {
  const keys: string[] = [];

  addUniqueKey(keys, process.env.GEMINI_API_KEY);
  addUniqueKey(keys, process.env.GOOGLE_GEMINI_API_KEY);

  const numberedKeys = Object.entries(process.env)
    .flatMap(([name, value]) => {
      if (!value) {
        return [];
      }

      const geminiMatch = name.match(/^GEMINI_API_KEY_(\d+)$/);
      const googleMatch = name.match(/^GOOGLE_GEMINI_API_KEY_(\d+)$/);
      const keyIndex = geminiMatch?.[1] ?? googleMatch?.[1];

      if (!keyIndex) {
        return [];
      }

      return [{ index: Number(keyIndex), name, value }];
    })
    .sort((a, b) => {
      if (a.index !== b.index) {
        return a.index - b.index;
      }
      return a.name.localeCompare(b.name);
    });

  for (const entry of numberedKeys) {
    addUniqueKey(keys, entry.value);
  }

  if (keys.length === 0) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  return keys;
};

export const isRateLimitError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('resource exhausted') ||
    lower.includes('quota')
  );
};
