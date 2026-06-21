import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';

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
