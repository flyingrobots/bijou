import { describe, expect, it } from 'vitest';
import { mockClock } from './clock.js';

describe('mockClock()', () => {
  it('advances now() deterministically', () => {
    const clock = mockClock({ nowMs: 100 });
    expect(clock.now()).toBe(100);
    clock.advanceBy(25);
    expect(clock.now()).toBe(125);
  });

  it('runs queued timeouts when time advances past their deadline', () => {
    const clock = mockClock();
    const calls: number[] = [];
    clock.setTimeout(() => calls.push(clock.now()), 10);
    clock.advanceBy(9);
    expect(calls).toEqual([]);
    clock.advanceBy(1);
    expect(calls).toEqual([10]);
  });

  it('runs intervals repeatedly and stops after dispose', () => {
    const clock = mockClock();
    const calls: number[] = [];
    const handle = clock.setInterval(() => calls.push(clock.now()), 5);
    clock.advanceBy(16);
    handle.dispose();
    clock.advanceBy(10);
    expect(calls).toEqual([5, 10, 15]);
  });

  it('flushes queued microtasks without advancing wall-clock time', () => {
    const clock = mockClock({ nowMs: 42 });
    const calls: number[] = [];
    clock.queueMicrotask(() => calls.push(clock.now()));
    clock.flushMicrotasks();
    expect(calls).toEqual([42]);
  });

  it('advances async command chains across native Promise boundaries', async () => {
    const clock = mockClock();
    const calls: number[] = [];
    const run = async () => {
      await new Promise<void>((resolve) => {
        clock.setTimeout(resolve, 5);
      });
      calls.push(clock.now());
      await new Promise<void>((resolve) => {
        clock.setTimeout(resolve, 5);
      });
      calls.push(clock.now());
    };

    const promise = run();
    await clock.advanceByAsync(10);
    await promise;
    expect(calls).toEqual([5, 10]);
  });

  it('throws when runAll() would loop forever on an active interval', () => {
    const clock = mockClock();
    clock.setInterval(() => {}, 5);

    expect(() => clock.runAll()).toThrow(/active interval timers/i);
  });

  it('still allows runAll() when an interval disposes itself', () => {
    const clock = mockClock();
    const calls: number[] = [];
    let handle: { dispose(): void } | undefined;
    handle = clock.setInterval(() => {
      calls.push(clock.now());
      handle?.dispose();
    }, 5);

    clock.runAll();
    expect(calls).toEqual([5]);
  });
});
