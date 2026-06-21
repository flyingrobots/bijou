import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';

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
