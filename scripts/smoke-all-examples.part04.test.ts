import { describe, expect, it } from 'vitest';
import { resolvePipeConcurrency } from './smoke-all-examples-lib.js';

describe('resolvePipeConcurrency', () => {
  it('uses an explicit positive integer when provided', () => {
    expect(resolvePipeConcurrency({ pipeConcurrency: 3 })).toBe(3);
  });

  it('bounds the default concurrency to a small local worker pool', () => {
    const concurrency = resolvePipeConcurrency();
    expect(concurrency).toBeGreaterThanOrEqual(1);
    expect(concurrency).toBeLessThanOrEqual(4);
  });
});
