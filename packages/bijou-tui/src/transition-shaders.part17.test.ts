import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { wipe, type TransitionCell } from './transition-shaders.js';

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

// ---------------------------------------------------------------------------
// Shader factories
// ---------------------------------------------------------------------------

describe('wipe() factory', () => {
  it('defaults to right', () => {
    const shader = wipe();
    expect(shader(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(true);
    expect(shader(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(false);
  });

  it('supports left direction', () => {
    const shader = wipe('left');
    // left: 1 - x/width < progress → 1 - 20/80 = 0.75 > 0.5 → false
    expect(shader(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(false);
    // 1 - 60/80 = 0.25 < 0.5 → true
    expect(shader(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(true);
  });

  it('supports up direction', () => {
    const shader = wipe('up');
    // up: 1 - y/height < progress → 1 - 20/24 ≈ 0.167 < 0.5 → true
    expect(shader(cell({ y: 20, height: 24, progress: 0.5 })).showNext).toBe(true);
    // 1 - 2/24 ≈ 0.917 > 0.5 → false
    expect(shader(cell({ y: 2, height: 24, progress: 0.5 })).showNext).toBe(false);
  });

  it('supports down direction', () => {
    const shader = wipe('down');
    // down: y/height < progress → 2/24 ≈ 0.083 < 0.5 → true
    expect(shader(cell({ y: 2, height: 24, progress: 0.5 })).showNext).toBe(true);
    // 20/24 ≈ 0.833 > 0.5 → false
    expect(shader(cell({ y: 20, height: 24, progress: 0.5 })).showNext).toBe(false);
  });
});
