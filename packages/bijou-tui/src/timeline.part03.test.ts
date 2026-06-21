import { describe, it, expect } from 'vitest';
import { timeline, type Timeline, type TimelineState } from './timeline.js';
import { EASINGS } from './spring.js';

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
// Stepping — tween tracks
// ---------------------------------------------------------------------------
describe('step (tweens)', () => {
  it('animates a tween from start to end', () => {
    const tl = timeline()
      .add('x', {
        type: 'tween',
        from: 0,
        to: 100,
        duration: 500,
        ease: EASINGS.linear,
      })
      .build();
    const state = runUntilDone(tl);
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state).x).toBe(100);
  });
  it('interpolates midway with linear easing', () => {
    const tl = timeline()
      .add('x', {
        type: 'tween',
        from: 0,
        to: 100,
        duration: 1000,
        ease: EASINGS.linear,
      })
      .build();
    // Run for ~500ms (30 frames at 60fps)
    const state = runFrames(tl, tl.init(), 30);
    const values = tl.values(state);
    expect(values.x).toBeCloseTo(50, 0);
  });
});
