import { describe, expect, it } from 'vitest';
import { isUnavailableError } from './geminiKeys';

describe('isUnavailableError', () => {
  it('returns true for 503 in error message', () => {
    expect(isUnavailableError(new Error('503 Service Unavailable'))).toBe(true);
    expect(isUnavailableError(new Error('Error: 503'))).toBe(true);
  });

  it('returns true for UNAVAILABLE status', () => {
    expect(
      isUnavailableError(
        new Error(
          '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}'
        )
      )
    ).toBe(true);
  });

  it('returns true for "high demand" message', () => {
    expect(
      isUnavailableError(new Error('This model is currently experiencing high demand.'))
    ).toBe(true);
  });

  it('returns true for "overloaded" message', () => {
    expect(isUnavailableError(new Error('Service overloaded, try again later'))).toBe(true);
  });

  it('returns false for rate limit errors', () => {
    expect(isUnavailableError(new Error('429 Too Many Requests'))).toBe(false);
    expect(isUnavailableError(new Error('Resource exhausted'))).toBe(false);
  });

  it('returns false for other errors', () => {
    expect(isUnavailableError(new Error('Network error'))).toBe(false);
    expect(isUnavailableError(new Error('Invalid API key'))).toBe(false);
  });
});
