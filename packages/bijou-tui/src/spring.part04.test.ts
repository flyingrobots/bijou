import { describe, it, expect } from 'vitest';
import { tweenStep, createTweenState, resolveTweenConfig, EASINGS } from './spring.js';

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
