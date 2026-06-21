import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { wipeShader, typewriter, reverse, type TransitionCell, type TransitionShaderFn } from './transition-shaders.js';

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
// Combinators
// ---------------------------------------------------------------------------

describe('reverse()', () => {
  it('reverses spatial reveal order (right-to-left wipe)', () => {
    const reversed = reverse(wipeShader);
    // Reversed wipe reveals from right side first.
    // At progress=0.5: cells on the right half (x >= 40) should showNext.
    // x=60, width=80: feed 1-0.5=0.5 → 60/80=0.75 > 0.5 → showNext=false → flip → true
    expect(reversed(cell({ x: 60, width: 80, progress: 0.5 })).showNext).toBe(true);
    // x=20: feed 0.5 → 20/80=0.25 < 0.5 → showNext=true → flip → false
    expect(reversed(cell({ x: 20, width: 80, progress: 0.5 })).showNext).toBe(false);
  });

  it('shows nothing at progress=0', () => {
    const reversed = reverse(wipeShader);
    expect(reversed(cell({ x: 0, width: 80, progress: 0 })).showNext).toBe(false);
    expect(reversed(cell({ x: 79, width: 80, progress: 0 })).showNext).toBe(false);
  });

  it('shows everything at progress=1', () => {
    const reversed = reverse(wipeShader);
    expect(reversed(cell({ x: 0, width: 80, progress: 1 })).showNext).toBe(true);
    expect(reversed(cell({ x: 79, width: 80, progress: 1 })).showNext).toBe(true);
  });

  it('drops marker overrides from the base shader', () => {
    // reverse(typewriter) at progress=1 evaluates typewriter at progress=0,
    // which emits a cursor override (overrideRole='marker') for cell (0,0).
    // Marker overrides are positional and must be dropped on reversal.
    const reversed = reverse(typewriter());
    const result = reversed(cell({ x: 0, y: 0, width: 80, height: 24, progress: 1 }));
    expect(result.showNext).toBe(true);
    expect(result.overrideChar).toBeUndefined();
  });

  it('preserves decoration overrides from the base shader', () => {
    // Decoration overrides (glitch noise, static blocks) are ambient and should
    // survive progress remapping.
    const decorationShader: TransitionShaderFn = () => ({
      showNext: true,
      overrideChar: '█',
      overrideRole: 'decoration',
    });
    const reversed = reverse(decorationShader);
    const result = reversed(cell({ progress: 0.5 }));
    expect(result.overrideChar).toBe('█');
    expect(result.overrideRole).toBe('decoration');
  });

  it('treats overrides without overrideRole as decoration (preserves them)', () => {
    const plainOverrideShader: TransitionShaderFn = () => ({
      showNext: true,
      overrideChar: 'X',
    });
    const reversed = reverse(plainOverrideShader);
    const result = reversed(cell({ progress: 0.5 }));
    expect(result.overrideChar).toBe('X');
  });
});
