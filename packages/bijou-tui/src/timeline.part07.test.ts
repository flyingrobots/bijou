import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';
import { EASINGS } from './spring.js';

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
