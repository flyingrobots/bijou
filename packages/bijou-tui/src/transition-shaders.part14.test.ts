import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { typewriterShader, type TransitionCell } from './transition-shaders.js';

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

describe('typewriterShader', () => {
  it('shows prev at progress=0', () => {
    expect(typewriterShader(cell({ x: 40, y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(typewriterShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('shows cursor at leading edge', () => {
    // progress=0 → revealed=0, cellIndex=0 → cursor
    const result = typewriterShader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0 }));
    expect(result.overrideChar).toBeDefined();
    expect(result.overrideCell?.char).toBe(result.overrideChar);
    expect(result.showNext).toBe(false);
  });

  it('reveals top-left before bottom-right', () => {
    const topLeft = typewriterShader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0.5 }));
    const bottomRight = typewriterShader(cell({ x: 79, y: 23, width: 80, height: 24, progress: 0.5 }));
    expect(topLeft.showNext).toBe(true);
    expect(bottomRight.showNext).toBe(false);
  });
});
