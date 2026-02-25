import { describe, it, expect } from 'vitest';
import { skeleton } from './skeleton.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('skeleton', () => {
  it('renders placeholder block in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = skeleton({ ctx });
    expect(result).toBe('░'.repeat(20));
  });

  it('respects custom width', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = skeleton({ width: 10, ctx });
    expect(result).toBe('░'.repeat(10));
  });

  it('renders multiple lines', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = skeleton({ width: 5, lines: 3, ctx });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('░'.repeat(5));
  });

  it('returns empty string in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(skeleton({ ctx })).toBe('');
  });

  it('returns Loading... in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(skeleton({ ctx })).toBe('Loading...');
  });

  it('renders in static mode same as interactive', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = skeleton({ width: 15, ctx });
    expect(result).toBe('░'.repeat(15));
  });
});
