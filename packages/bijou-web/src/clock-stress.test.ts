import { describe, expect, it } from 'vitest';
import type { TimerHandle } from '@flyingrobots/bijou';
import { createWebClock } from './index.js';
import { createFakeClockHost } from './clock.test-support.js';

function activeTimeouts(): number {
  return process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length;
}

/** Deterministic linear congruential generator, so a failure replays exactly. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('createWebClock() schedule and dispose stress', () => {
  it('leaves zero leaked handles after 500 rapid cycles on a fake host', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    const random = createRandom(792);
    const open: TimerHandle[] = [];
    let fired = 0;
    for (let cycle = 0; cycle < 500; cycle++) {
      open.push(clock.setTimeout(() => { fired++; }, Math.floor(random() * 20)));
      open.push(clock.setInterval(() => { fired++; }, 1 + Math.floor(random() * 20)));
      if (random() < 0.5) host.advance(Math.floor(random() * 10));
      while (open.length > 0 && random() < 0.6) {
        const index = Math.floor(random() * open.length);
        const [handle] = open.splice(index, 1);
        handle?.dispose();
      }
    }
    expect(fired).toBeGreaterThan(0);
    for (const handle of open) handle.dispose();
    expect(host.liveTimers()).toBe(0);
    expect(clock.pendingHandles()).toBe(0);
    const before = fired;
    host.advance(10_000);
    expect(fired).toBe(before);
  });

  it('leaves zero leaked handles after 500 rapid cycles on the global host', () => {
    const baseline = activeTimeouts();
    const clock = createWebClock();
    let fired = 0;
    for (let cycle = 0; cycle < 500; cycle++) {
      const timeout = clock.setTimeout(() => { fired++; }, 60_000);
      const interval = clock.setInterval(() => { fired++; }, 60_000);
      const frame = clock.requestFrame(() => { fired++; });
      expect(clock.pendingHandles()).toBe(3);
      interval.dispose();
      frame.dispose();
      timeout.dispose();
    }
    expect(clock.pendingHandles()).toBe(0);
    expect(activeTimeouts()).toBe(baseline);
    expect(fired).toBe(0);
  });
});
