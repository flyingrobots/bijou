import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { curtain, type TransitionCell } from './transition-shaders.js';

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

describe('curtain() factory', () => {
  it('supports horizontal direction', () => {
    const shader = curtain('horizontal');
    // Center (y=12 of 24): distFromCenter = 0
    expect(shader(cell({ y: 12, height: 24, progress: 0.3 })).showNext).toBe(true);
    // Edge (y=0 of 24): distFromCenter = 1
    expect(shader(cell({ y: 0, height: 24, progress: 0.3 })).showNext).toBe(false);
  });
});
