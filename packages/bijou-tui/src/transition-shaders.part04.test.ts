import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { fadeShader, type TransitionCell } from './transition-shaders.js';

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

describe('fadeShader', () => {
  it('shows prev at progress=0', () => {
    expect(fadeShader(cell({ progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(fadeShader(cell({ progress: 1 })).showNext).toBe(true);
  });

  it('hard-cuts at midpoint', () => {
    expect(fadeShader(cell({ progress: 0.49 })).showNext).toBe(false);
    expect(fadeShader(cell({ progress: 0.51 })).showNext).toBe(true);
  });
});
