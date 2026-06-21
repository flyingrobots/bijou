import { describe, it, expect } from 'vitest';
import { springStep, createSpringState, SPRING_PRESETS } from './spring.js';

// ---------------------------------------------------------------------------
// Spring physics
// ---------------------------------------------------------------------------

describe('springStep', () => {
  it('moves toward the target', () => {
    const state = createSpringState(0);
    const config = SPRING_PRESETS.default;
    const next = springStep(state, 100, config, 1 / 60);
    expect(next.value).toBeGreaterThan(0);
    expect(next.done).toBe(false);
  });

  it('settles at the target after enough steps', () => {
    let state = createSpringState(0);
    const config = SPRING_PRESETS.stiff;
    for (let i = 0; i < 600; i++) {
      state = springStep(state, 100, config, 1 / 60);
      if (state.done) break;
    }
    expect(state.done).toBe(true);
    expect(state.value).toBe(100);
    expect(state.velocity).toBe(0);
  });

  it('handles negative targets', () => {
    let state = createSpringState(50);
    const config = SPRING_PRESETS.stiff;
    for (let i = 0; i < 600; i++) {
      state = springStep(state, -20, config, 1 / 60);
      if (state.done) break;
    }
    expect(state.done).toBe(true);
    expect(state.value).toBe(-20);
  });

  it('wobbly preset overshoots the target', () => {
    let state = createSpringState(0);
    const config = SPRING_PRESETS.wobbly;
    let maxValue = 0;
    for (let i = 0; i < 600; i++) {
      state = springStep(state, 100, config, 1 / 60);
      if (state.value > maxValue) maxValue = state.value;
      if (state.done) break;
    }
    // Wobbly should overshoot past 100
    expect(maxValue).toBeGreaterThan(100);
    expect(state.done).toBe(true);
  });

  it('is already done when starting at the target', () => {
    const state = createSpringState(42);
    const result = springStep(state, 42, SPRING_PRESETS.default, 1 / 60);
    expect(result.done).toBe(true);
    expect(result.value).toBe(42);
  });
});
