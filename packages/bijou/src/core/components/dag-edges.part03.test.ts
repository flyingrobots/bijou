import { describe, it, expect } from 'vitest';
import { arrowChar } from './dag-edges.js';

describe('arrowChar', () => {
  it('returns filled arrowheads by default', () => {
    expect(arrowChar()).toBe('▼');
  });

  it('returns outlined arrowheads for dashed edges', () => {
    expect(arrowChar('dashed')).toBe('▾');
  });
});
