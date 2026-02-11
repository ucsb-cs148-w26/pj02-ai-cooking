import { describe, expect, it } from 'vitest';
import { isValidDate } from './expirationDateService';

describe('isValidDate', () => {
  it('returns true for a valid ISO date', () => {
    expect(isValidDate('2026-02-09')).toBe(true);
  });

  it('returns false for non-ISO formats', () => {
    expect(isValidDate('02/09/2026')).toBe(false);
    expect(isValidDate('2026-2-9')).toBe(false);
  });

  it('returns false for impossible months', () => {
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-00-10')).toBe(false);
  });

  it('returns false for impossible day values', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-04-31')).toBe(false);
  });

  it('handles leap years correctly', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2025-02-29')).toBe(false);
  });
});
