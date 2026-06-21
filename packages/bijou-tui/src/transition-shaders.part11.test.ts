import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { blindsShader, type TransitionCell } from './transition-shaders.js';

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

describe('blindsShader', () => {
  it('shows prev at progress=0', () => {
    expect(blindsShader(cell({ y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(blindsShader(cell({ y: 12, progress: 1 })).showNext).toBe(true);
  });

  it('reveals in horizontal bands', () => {
    // Two cells at different y positions within the same band should agree
    const a = blindsShader(cell({ y: 0, height: 24, progress: 0.5 }));
    const b = blindsShader(cell({ y: 1, height: 24, progress: 0.5 }));
    // y=0: band=(0/24*8)%1 = 0 < 0.5 → true
    // y=1: band=(1/24*8)%1 = 0.333 < 0.5 → true
    expect(a.showNext).toBe(true);
    expect(b.showNext).toBe(true);
  });
});
