import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { scrambleShader, type TransitionCell } from './transition-shaders.js';

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

describe('scrambleShader', () => {
  it('shows prev at progress=0', () => {
    const result = scrambleShader(cell({ rand: 0.5, progress: 0 }));
    expect(result.showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    const result = scrambleShader(cell({ rand: 0.5, progress: 1 }));
    expect(result.showNext).toBe(true);
  });

  it('produces cell override at peak scramble (midpoint)', () => {
    // At progress=0.5, scrambleAmount=1, so rand 0.5 < 0.8 → override
    const result = scrambleShader(cell({ rand: 0.5, progress: 0.5 }));
    expect(result.overrideChar).toBeDefined();
    expect(result.overrideCell?.char).toBe(result.overrideChar);
  });

  it('resolves to next page past midpoint with high rand', () => {
    // At progress=0.9, scrambleAmount=0.2, rand 0.5 > 0.16 → no override, showNext true
    const result = scrambleShader(cell({ rand: 0.5, progress: 0.9 }));
    expect(result.showNext).toBe(true);
    expect(result.overrideChar).toBeUndefined();
  });
});
