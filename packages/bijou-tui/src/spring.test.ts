import { describe, it, expect } from 'vitest';
import {
  springStep,
  createSpringState,
  resolveSpringConfig,
  SPRING_PRESETS,
  tweenStep,
  createTweenState,
  resolveTweenConfig,
  EASINGS,
} from './spring.js';

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

describe('createSpringState', () => {
  it('creates state at the given value with zero velocity', () => {
    const state = createSpringState(50);
    expect(state.value).toBe(50);
    expect(state.velocity).toBe(0);
    expect(state.done).toBe(false);
  });
});

describe('resolveSpringConfig', () => {
  it('returns default when called with no args', () => {
    expect(resolveSpringConfig()).toEqual(SPRING_PRESETS.default);
  });

  it('resolves a preset name', () => {
    expect(resolveSpringConfig('wobbly')).toEqual(SPRING_PRESETS.wobbly);
  });

  it('merges partial config with defaults', () => {
    const config = resolveSpringConfig({ stiffness: 300 });
    expect(config.stiffness).toBe(300);
    expect(config.damping).toBe(SPRING_PRESETS.default.damping);
  });
});

// ---------------------------------------------------------------------------
// Tween
// ---------------------------------------------------------------------------

describe('tweenStep', () => {
  it('starts at from value', () => {
    const state = createTweenState(0);
    const config = resolveTweenConfig({ from: 0, to: 100, duration: 1000 });
    // First step at dt=0 should still be at from
    const next = tweenStep(state, config, 0);
    expect(next.value).toBe(0);
    expect(next.done).toBe(false);
  });

  it('reaches the target after full duration', () => {
    let state = createTweenState(0);
    const config = resolveTweenConfig({ from: 0, to: 100, duration: 1000 });
    state = tweenStep(state, config, 1000);
    expect(state.value).toBe(100);
    expect(state.done).toBe(true);
  });

  it('clamps at target if elapsed exceeds duration', () => {
    let state = createTweenState(0);
    const config = resolveTweenConfig({ from: 0, to: 50, duration: 500 });
    state = tweenStep(state, config, 9999);
    expect(state.value).toBe(50);
    expect(state.done).toBe(true);
  });

  it('interpolates midway with linear easing', () => {
    let state = createTweenState(0);
    const config = resolveTweenConfig({
      from: 0,
      to: 100,
      duration: 1000,
      ease: EASINGS.linear,
    });
    state = tweenStep(state, config, 500);
    expect(state.value).toBeCloseTo(50, 1);
    expect(state.done).toBe(false);
  });

  it('handles zero duration', () => {
    let state = createTweenState(0);
    const config = resolveTweenConfig({ from: 0, to: 100, duration: 0 });
    state = tweenStep(state, config, 0);
    expect(state.value).toBe(100);
    expect(state.done).toBe(true);
  });

  it('accumulates elapsed across multiple steps', () => {
    let state = createTweenState(0);
    const config = resolveTweenConfig({
      from: 0,
      to: 100,
      duration: 1000,
      ease: EASINGS.linear,
    });
    state = tweenStep(state, config, 250);
    expect(state.elapsed).toBe(250);
    state = tweenStep(state, config, 250);
    expect(state.elapsed).toBe(500);
    expect(state.value).toBeCloseTo(50, 1);
  });
});

describe('resolveTweenConfig', () => {
  it('applies defaults for from/to/ease', () => {
    const config = resolveTweenConfig({ duration: 500 });
    expect(config.from).toBe(0);
    expect(config.to).toBe(1);
    expect(config.duration).toBe(500);
    expect(config.ease).toBe(EASINGS.easeOutCubic);
  });
});

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

describe('EASINGS', () => {
  it('linear returns t unchanged', () => {
    expect(EASINGS.linear(0)).toBe(0);
    expect(EASINGS.linear(0.5)).toBe(0.5);
    expect(EASINGS.linear(1)).toBe(1);
  });

  it.each(Object.keys(EASINGS))('%s maps 0→0 and 1→1', (name) => {
    const fn = EASINGS[name as keyof typeof EASINGS];
    expect(fn(0)).toBeCloseTo(0, 5);
    expect(fn(1)).toBeCloseTo(1, 5);
  });

  it('easeIn starts slow', () => {
    expect(EASINGS.easeIn(0.1)).toBeLessThan(0.1);
  });

  it('easeOut starts fast', () => {
    expect(EASINGS.easeOut(0.1)).toBeGreaterThan(0.1);
  });
});
