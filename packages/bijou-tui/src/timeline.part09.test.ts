import { describe, it, expect } from 'vitest';
import { timeline, type Timeline, type TimelineState } from './timeline.js';

/** Helper: step a timeline N frames at 60fps and return final state. */
function runFrames(tl: Timeline, state: TimelineState, n: number): TimelineState {
  const dt = 1 / 60;
  for (let i = 0; i < n; i++) {
    state = tl.step(state, dt);
  }
  return state;
}

/** Helper: step until done or max frames, return state. */
function runUntilDone(tl: Timeline, maxFrames = 3600): TimelineState {
  let state = tl.init();
  const dt = 1 / 60;
  for (let i = 0; i < maxFrames; i++) {
    state = tl.step(state, dt);
    if (tl.done(state)) break;
  }
  return state;
}

// ---------------------------------------------------------------------------
// Mixed spring + tween
// ---------------------------------------------------------------------------
describe('mixed spring + tween timeline', () => {
  it('runs spring and tween in parallel', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'default' })
      .add('opacity', { type: 'tween', from: 0, to: 1, duration: 300 }, '<')
      .build();
    // After a few frames, both should be animating
    const state = runFrames(tl, tl.init(), 10);
    const values = tl.values(state);
    expect(values.x).toBeGreaterThan(0);
    expect(values.opacity).toBeGreaterThan(0);
    // Run to completion
    const final = runUntilDone(tl);
    expect(tl.values(final).x).toBe(100);
    expect(tl.values(final).opacity).toBe(1);
  });
  it('handles staggered multi-track timeline', () => {
    const tl = timeline()
      .add('slideIn', { type: 'tween', from: -100, to: 0, duration: 300 })
      .add('fadeIn', { type: 'tween', from: 0, to: 1, duration: 200 }, '-=100')
      .label('settled')
      .add('bounce', { from: 0, to: 10, spring: 'wobbly' }, 'settled')
      .build();
    const final = runUntilDone(tl);
    expect(tl.done(final)).toBe(true);
    expect(tl.values(final).slideIn).toBe(0);
    expect(tl.values(final).fadeIn).toBe(1);
    expect(tl.values(final).bounce).toBe(10);
  });
});
