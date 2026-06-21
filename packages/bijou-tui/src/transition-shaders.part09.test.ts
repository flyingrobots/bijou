import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { diamondShader, type TransitionCell } from './transition-shaders.js';

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

describe('diamondShader', () => {
  it('shows prev at progress=0', () => {
    expect(diamondShader(cell({ x: 40, y: 12, progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(diamondShader(cell({ x: 0, y: 0, progress: 1 })).showNext).toBe(true);
  });

  it('reveals center before corners', () => {
    const center = diamondShader(cell({ x: 40, y: 12, progress: 0.3 }));
    const corner = diamondShader(cell({ x: 0, y: 0, progress: 0.3 }));
    expect(center.showNext).toBe(true);
    expect(corner.showNext).toBe(false);
  });
});
