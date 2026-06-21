import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { radial, type TransitionCell } from './transition-shaders.js';

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

describe('radial() factory', () => {
  it('supports custom origin', () => {
    const shader = radial(0, 0); // top-left origin
    // Cell at (0,0) is distance 0 from origin → showNext at any progress > 0
    expect(shader(cell({ x: 0, y: 0, progress: 0.1 })).showNext).toBe(true);
    // Far corner should not show at low progress
    expect(shader(cell({ x: 79, y: 23, progress: 0.1 })).showNext).toBe(false);
  });
});
