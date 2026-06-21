import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { blinds, type TransitionCell } from './transition-shaders.js';

const ctx = createTestContext({ mode: 'interactive' });

function cell(overrides: Partial<TransitionCell> = {}): TransitionCell {
  return {
    x: 0,
    y: 0,
    width: 80,
    height: 24,
    progress: 0.5,
    rand: 0.5,
    frame: 0,
    ctx,
    ...overrides,
  };
}

describe('blinds() factory', () => {
  it('supports vertical direction', () => {
    const shader = blinds(8, 'vertical');
    const a = shader(cell({ x: 0, width: 80, progress: 0.5 }));
    expect(a.showNext).toBe(true); // band = (0/80*8)%1 = 0 < 0.5
  });

  it('supports custom count', () => {
    const shader = blinds(4, 'horizontal');
    // y=6 of 24, count=4: band = (6/24*4)%1 = 1%1 = 0 < 0.5 → true
    expect(shader(cell({ y: 6, height: 24, progress: 0.5 })).showNext).toBe(true);
  });
});
