import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { wipeShader, type TransitionCell } from './transition-shaders.js';

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

describe('wipeShader', () => {
  it('shows prev at progress=0', () => {
    expect(wipeShader(cell({ x: 40, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(wipeShader(cell({ x: 79, progress: 1 })).showNext).toBe(true);
  });

  it('wipes left-to-right based on x/width vs progress', () => {
    // x=20, width=80 → 0.25 < 0.5 → showNext
    expect(wipeShader(cell({ x: 20, progress: 0.5 })).showNext).toBe(true);
    // x=60, width=80 → 0.75 > 0.5 → showPrev
    expect(wipeShader(cell({ x: 60, progress: 0.5 })).showNext).toBe(false);
  });
});
