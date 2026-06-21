import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { spiralShader, type TransitionCell } from './transition-shaders.js';

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

describe('spiralShader', () => {
  it('shows prev at progress=0', () => {
    expect(spiralShader(cell({ x: 0, y: 0, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    // At progress=1, spiralT < 1 is always true for values in [0,1)
    expect(spiralShader(cell({ x: 40, y: 12, progress: 1 })).showNext).toBe(true);
  });
});
