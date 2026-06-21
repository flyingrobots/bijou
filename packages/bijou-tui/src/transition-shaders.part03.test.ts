import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { gridShader, type TransitionCell } from './transition-shaders.js';

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

describe('gridShader', () => {
  it('shows prev at progress=0', () => {
    expect(gridShader(cell({ x: 0, y: 0, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(gridShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('uses 8x4 block grid pattern', () => {
    // gx=0, gy=0 → (0+0)%10=0, 0/10=0 < 0.5 → showNext
    expect(gridShader(cell({ x: 0, y: 0, progress: 0.5 })).showNext).toBe(true);
    // gx=1, gy=1 → (1+1)%10=2, 2/10=0.2 < 0.5 → showNext
    expect(gridShader(cell({ x: 8, y: 4, progress: 0.5 })).showNext).toBe(true);
    // gx=5, gy=2 → (5+2)%10=7, 7/10=0.7 > 0.5 → showPrev
    expect(gridShader(cell({ x: 40, y: 8, progress: 0.5 })).showNext).toBe(false);
  });
});
