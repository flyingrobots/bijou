import { describe, expect, it } from 'vitest';
import { timeline, type TimelineState } from './timeline.js';

describe('timeline invariant diagnostics', () => {
  it('identifies a missing track state by name', () => {
    const compiled = timeline()
      .add('opacity', { type: 'tween', from: 0, to: 1, duration: 100 })
      .build();
    const incomplete: TimelineState = { elapsedMs: 0, tracks: {} };

    expect(() => compiled.values(incomplete))
      .toThrow('Timeline: missing track "opacity" state');
  });
});
