import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { wipeShader, overlay, type TransitionCell } from './transition-shaders.js';

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

describe('overlay()', () => {
  it('uses top shader override when present', () => {
    const base = wipeShader;
    const top: typeof wipeShader = () => ({ showNext: false, overrideChar: 'X' });
    const combined = overlay(base, top);
    const result = combined(cell());
    expect(result.overrideChar).toBe('X');
  });

  it('falls through to base when top has no override', () => {
    const base: typeof wipeShader = () => ({ showNext: true, overrideChar: 'B' });
    const top: typeof wipeShader = () => ({ showNext: false });
    const combined = overlay(base, top);
    const result = combined(cell());
    expect(result.overrideChar).toBe('B');
  });
});
