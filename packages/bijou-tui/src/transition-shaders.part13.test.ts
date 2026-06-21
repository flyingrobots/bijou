import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { pixelateShader, type TransitionCell } from './transition-shaders.js';

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

describe('pixelateShader', () => {
  it('shows prev at progress=0', () => {
    const result = pixelateShader(cell({ progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = pixelateShader(cell({ progress: 1 }));
    expect(result.showNext).toBe(true);
  });
});
