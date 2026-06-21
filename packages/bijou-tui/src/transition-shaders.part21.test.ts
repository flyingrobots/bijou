import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { typewriter, type TransitionCell } from './transition-shaders.js';

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

describe('typewriter() factory', () => {
  it('supports custom cursor', () => {
    const shader = typewriter('_');
    const result = shader(cell({ x: 0, y: 0, width: 80, height: 24, progress: 0 }));
    expect(result.overrideChar).toBeDefined();
  });
});
