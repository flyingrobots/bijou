import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { matrixShader, type TransitionCell } from './transition-shaders.js';

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

describe('matrixShader', () => {
  it('shows prev at progress=0', () => {
    const result = matrixShader(cell({ rand: 0.5, progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = matrixShader(cell({ rand: 0.5, progress: 1 }));
    expect(result.showNext).toBe(true);
  });

  it('produces cell override at the leading edge', () => {
    // rand just above threshold but within threshold+edge
    const result = matrixShader(cell({ rand: 0.55, progress: 0.5 }));
    expect(result.showNext).toBe(false);
    expect(result.overrideChar).toBeDefined();
    expect(result.overrideCell?.char).toBe(result.overrideChar);
  });

  it('shows next when rand < threshold', () => {
    const result = matrixShader(cell({ rand: 0.3, progress: 0.5 }));
    expect(result.showNext).toBe(true);
    expect(result.overrideChar).toBeUndefined();
  });
});
