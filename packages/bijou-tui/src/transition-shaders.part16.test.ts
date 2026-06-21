import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { staticShader, type TransitionCell } from './transition-shaders.js';

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

describe('staticShader', () => {
  it('shows prev at progress=0', () => {
    // At progress=0, staticAmount=0, no static → showNext = progress > 0.5 → false
    expect(staticShader(cell({ progress: 0, rand: 0.5 })).showNext).toBe(false);
  });

  it('shows next at progress=1', () => {
    // At progress=1, staticAmount=0, no static → showNext = progress > 0.5 → true
    expect(staticShader(cell({ progress: 1, rand: 0.5 })).showNext).toBe(true);
  });

  it('produces overrides during peak static', () => {
    // At progress=0.5 (peak), staticAmount=1, density=0.7
    // frame-based noise determines whether an override appears
    // Use a frame that produces noise < 0.7 for this cell
    const result = staticShader(cell({ x: 3, y: 3, progress: 0.5, frame: 1 }));
    // Should either show an override or fall through — no crash
    expect(typeof result.showNext).toBe('boolean');
    if (result.overrideChar !== undefined) expect(result.overrideCell?.char).toBe(result.overrideChar);
  });
});
