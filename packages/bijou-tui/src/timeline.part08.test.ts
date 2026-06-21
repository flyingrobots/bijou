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
// done()
// ---------------------------------------------------------------------------
describe('done', () => {
  it('returns false when tracks are still running', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 1, duration: 500 })
      .build();
    const state = runFrames(tl, tl.init(), 5);
    expect(tl.done(state)).toBe(false);
  });
  it('returns true when all tracks are complete', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 1, duration: 200 })
      .add('y', { from: 0, to: 50, spring: 'stiff' })
      .build();
    const state = runUntilDone(tl);
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state).x).toBe(1);
    expect(tl.values(state).y).toBe(50);
  });
});
