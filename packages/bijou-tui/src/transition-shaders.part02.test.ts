import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { dissolveShader, type TransitionCell } from './transition-shaders.js';

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

describe('dissolveShader', () => {
  it('shows prev at progress=0', () => {
    expect(dissolveShader(cell({ rand: 0.5, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(dissolveShader(cell({ rand: 0.99, progress: 1 })).showNext).toBe(true);
  });

  it('dissolves based on rand vs progress', () => {
    expect(dissolveShader(cell({ rand: 0.3, progress: 0.5 })).showNext).toBe(true);
    expect(dissolveShader(cell({ rand: 0.7, progress: 0.5 })).showNext).toBe(false);
  });
});
