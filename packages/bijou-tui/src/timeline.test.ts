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
// Builder
// ---------------------------------------------------------------------------

describe('timeline builder', () => {
  it('builds a timeline with a single tween track', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 100, duration: 500 })
      .build();

    expect(tl.trackNames).toEqual(['x']);
    expect(tl.estimatedDurationMs).toBe(500);
  });

  it('builds a timeline with a single spring track', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'stiff' })
      .build();

    expect(tl.trackNames).toEqual(['x']);
    expect(tl.estimatedDurationMs).toBeGreaterThan(0);
  });

  it('builds a timeline with multiple tracks', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 100, duration: 300 })
      .add('y', { type: 'tween', from: 0, to: 50, duration: 200 })
      .build();

    expect(tl.trackNames).toEqual(['x', 'y']);
    // y starts at 300ms (after x), total = 300 + 200 = 500
    expect(tl.estimatedDurationMs).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// init / values
// ---------------------------------------------------------------------------

describe('init', () => {
  it('initializes all tracks at their from values', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 10, to: 100, duration: 300 })
      .add('opacity', { type: 'tween', from: 0, to: 1, duration: 200 }, '<')
      .build();

    const state = tl.init();
    const values = tl.values(state);
    expect(values.x).toBe(10);
    expect(values.opacity).toBe(0);
  });
});

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

// ---------------------------------------------------------------------------
// Stepping — spring tracks
// ---------------------------------------------------------------------------

describe('step (springs)', () => {
  it('animates a spring to the target', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'stiff' })
      .build();

    const state = runUntilDone(tl);
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state).x).toBe(100);
  });

  it('wobbly spring overshoots before settling', () => {
    const tl = timeline()
      .add('x', { from: 0, to: 100, spring: 'wobbly' })
      .build();

    let state = tl.init();
    let maxValue = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 3600; i++) {
      state = tl.step(state, dt);
      const v = tl.values(state).x!;
      if (v > maxValue) maxValue = v;
      if (tl.done(state)) break;
    }
    expect(maxValue).toBeGreaterThan(100);
    expect(tl.values(state).x).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Position parameter
// ---------------------------------------------------------------------------

describe('position parameter', () => {
  it('sequential by default — second track starts after first', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200, ease: EASINGS.linear })
      .build();

    // At 200ms (12 frames), track a should be animating, track b should not
    const mid = runFrames(tl, tl.init(), 12);
    const midValues = tl.values(mid);
    expect(midValues.a).toBeGreaterThan(0);
    expect(midValues.b).toBe(0); // b hasn't started yet
  });

  it('"<" starts at same time as previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 300, ease: EASINGS.linear }, '<')
      .build();

    // Total duration should be 300, not 600
    expect(tl.estimatedDurationMs).toBe(300);

    // Both should animate together
    const mid = runFrames(tl, tl.init(), 9); // 150ms
    const values = tl.values(mid);
    expect(values.a).toBeCloseTo(values.b!, 2);
  });

  it('"+=N" adds gap after previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '+=100')
      .build();

    // b starts at 200 + 100 = 300ms
    expect(tl.estimatedDurationMs).toBe(500);
  });

  it('"-=N" overlaps with previous', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 300 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '-=100')
      .build();

    // b starts at 300 - 100 = 200ms, total = 200 + 200 = 400
    expect(tl.estimatedDurationMs).toBe(400);
  });

  it('absolute number positions at exact time', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 }, 1000)
      .build();

    // Track starts at 1000ms
    const before = runFrames(tl, tl.init(), 30); // 500ms
    expect(tl.values(before).a).toBe(0); // not started

    const after = runFrames(tl, before, 42); // +700ms = 1200ms total
    expect(tl.values(after).a).toBeGreaterThan(0); // animating
  });
});

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

describe('labels', () => {
  it('label marks the current position', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 })
      .label('mid')
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, 'mid')
      .build();

    // b starts at label 'mid' which is at 200ms (end of a)
    expect(tl.estimatedDurationMs).toBe(400);
  });

  it('label with offset "label+=N"', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 200 })
      .label('mid')
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, 'mid+=100')
      .build();

    // b starts at 200 + 100 = 300ms
    expect(tl.estimatedDurationMs).toBe(500);
  });

  it('throws on unknown label', () => {
    expect(() => {
      timeline()
        .add('a', { type: 'tween', from: 0, to: 1, duration: 200 }, 'nope')
        .build();
    }).toThrow('unknown label "nope"');
  });
});

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

describe('callbacks', () => {
  it('fires callbacks when elapsed crosses the trigger point', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 1, duration: 500, ease: EASINGS.linear })
      .call('halfway', '+=0')
      .build();

    // 'halfway' triggers at 500ms (end of x + 0)
    let prev = tl.init();
    let fired: string[] = [];
    const dt = 1 / 60;

    for (let i = 0; i < 600; i++) {
      const next = tl.step(prev, dt);
      const f = tl.firedCallbacks(prev, next);
      if (f.length > 0) fired = [...fired, ...f];
      prev = next;
    }

    expect(fired).toContain('halfway');
  });

  it('callback with position at label', () => {
    const tl = timeline()
      .add('x', { type: 'tween', from: 0, to: 1, duration: 300 })
      .label('done')
      .call('onDone', 'done')
      .build();

    let prev = tl.init();
    const fired: string[] = [];
    const dt = 1 / 60;

    for (let i = 0; i < 600; i++) {
      const next = tl.step(prev, dt);
      fired.push(...tl.firedCallbacks(prev, next));
      prev = next;
    }

    expect(fired).toContain('onDone');
  });

  it('does not fire the same callback twice', () => {
    const tl = timeline()
      .call('start', 0)
      .add('x', { type: 'tween', from: 0, to: 1, duration: 200 })
      .build();

    let prev = tl.init();
    const fired: string[] = [];
    const dt = 1 / 60;

    for (let i = 0; i < 60; i++) {
      const next = tl.step(prev, dt);
      fired.push(...tl.firedCallbacks(prev, next));
      prev = next;
    }

    const startCount = fired.filter((f) => f === 'start').length;
    expect(startCount).toBe(1);
  });
});

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

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('empty timeline is immediately done', () => {
    const tl = timeline().build();
    const state = tl.init();
    expect(tl.done(state)).toBe(true);
    expect(tl.values(state)).toEqual({});
  });

  it('callback-only timeline has no tracks', () => {
    const tl = timeline()
      .call('ping', 100)
      .build();

    const state = tl.init();
    expect(tl.done(state)).toBe(true);
    expect(tl.trackNames).toEqual([]);
  });

  it('<+= offset from previous start', () => {
    const tl = timeline()
      .add('a', { type: 'tween', from: 0, to: 1, duration: 400 })
      .add('b', { type: 'tween', from: 0, to: 1, duration: 200 }, '<+=100')
      .build();

    // a starts at 0, b starts at 0 + 100 = 100ms
    // total: max(0+400, 100+200) = 400
    expect(tl.estimatedDurationMs).toBe(400);
  });
});
