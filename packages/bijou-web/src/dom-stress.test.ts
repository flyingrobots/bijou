import { describe, expect, it } from 'vitest';
import { mountControls } from './dom-mount.test-support.js';

const IDS = ['app', 'app.count', 'app.increment', 'app.name', 'app.enabled', 'app.chip'];

describe('mountBijouDom() stress', () => {
  it('patches 200 sequential updates in place with bounded writes and no orphaned listeners', () => {
    const { doc, handle, node } = mountControls();
    const increment = node('app.increment');
    doc.dispatch(increment, 'click');
    const elements = IDS.map((id) => node(id));
    const created = doc.counts.created;
    const listeners = doc.liveListeners();
    const writes: number[] = [];

    for (let step = 0; step < 200; step += 1) {
      const before = doc.counts.writes;
      if (step % 2 === 0) doc.dispatch(increment, 'click');
      else doc.dispatch(node('app.enabled'), 'click');
      writes.push(doc.counts.writes - before);
    }

    expect(handle.controller.frame().model.count).toBe(101);
    expect(Math.max(...writes)).toBe(1);
    expect(doc.counts.created).toBe(created);
    expect(doc.liveListeners()).toBe(listeners);
    expect(IDS.map((id) => node(id)).every((element, index) => element === elements[index])).toBe(true);
    handle.stop();
    expect(doc.liveListeners()).toBe(0);
  });
});
