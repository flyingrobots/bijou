import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { meltShader, type TransitionCell } from './transition-shaders.js';

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

describe('meltShader', () => {
  it('shows prev at progress=0', () => {
    expect(meltShader(cell({ x: 0, y: 12, height: 24, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1 for all rows', () => {
    // At progress=1, dropStart = 1.4 - variability (max 0.4) = min 1.0
    // y/height max = 23/24 ≈ 0.958 < 1.0 → showNext
    for (let y = 0; y < 24; y++) {
      expect(meltShader(cell({ x: 0, y, height: 24, progress: 1 })).showNext).toBe(true);
    }
  });

  it('melts top-down', () => {
    // Top rows reveal before bottom rows at same x
    const top = meltShader(cell({ x: 0, y: 0, height: 24, progress: 0.5 }));
    const bottom = meltShader(cell({ x: 0, y: 23, height: 24, progress: 0.5 }));
    // If top shows next, bottom may or may not; but top should be at least as advanced
    expect(top.showNext || !bottom.showNext).toBe(true);
  });
});
