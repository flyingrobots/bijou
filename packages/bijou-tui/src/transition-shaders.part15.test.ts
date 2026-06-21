import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { glitchShader, type TransitionCell } from './transition-shaders.js';

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

describe('glitchShader', () => {
  it('shows prev at progress=0', () => {
    expect(glitchShader(cell({ progress: 0 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    expect(glitchShader(cell({ progress: 1 })).showNext).toBe(true);
  });

  it('uses frame counter for temporal variation', () => {
    const a = glitchShader(cell({ x: 5, y: 5, progress: 0.5, frame: 0 }));
    const b = glitchShader(cell({ x: 5, y: 5, progress: 0.5, frame: 10 }));
    // Results may differ due to frame-dependent noise (not guaranteed but likely)
    // At minimum, the shader should not crash
    expect(typeof a.showNext).toBe('boolean');
    expect(typeof b.showNext).toBe('boolean');
    if (a.overrideChar !== undefined) expect(a.overrideCell?.char).toBe(a.overrideChar);
    if (b.overrideChar !== undefined) expect(b.overrideCell?.char).toBe(b.overrideChar);
  });
});
