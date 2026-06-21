import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { curtainShader, type TransitionCell } from './transition-shaders.js';

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

describe('curtainShader', () => {
  it('shows prev at progress=0', () => {
    expect(curtainShader(cell({ x: 40, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(curtainShader(cell({ x: 0, progress: 1 })).showNext).toBe(true);
  });

  it('reveals center before edges', () => {
    // Center (x=40 of 80): distFromCenter = |0.5-0.5|*2 = 0
    const center = curtainShader(cell({ x: 40, width: 80, progress: 0.3 }));
    // Edge (x=0 of 80): distFromCenter = |0-0.5|*2 = 1
    const edge = curtainShader(cell({ x: 0, width: 80, progress: 0.3 }));
    expect(center.showNext).toBe(true);
    expect(edge.showNext).toBe(false);
  });
});
