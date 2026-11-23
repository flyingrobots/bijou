import { describe, expect, it } from 'vitest';
import { createWebClock } from './index.js';
import { createFakeClockHost } from './clock.test-support.js';

describe('createWebClock() with an injected host', () => {
  it('reads wall-clock time and builds dates from the host', () => {
    const host = createFakeClockHost({ startMs: 1_000 });
    const clock = createWebClock({ host });
    expect(clock.now()).toBe(1_000);
    expect(clock.date().getTime()).toBe(1_000);
    expect(clock.date(5).getTime()).toBe(5);
    host.advance(250);
    expect(clock.now()).toBe(1_250);
    expect(clock.monotonicNow()).toBe(250);
  });

  it('fires a timeout once and releases its handle', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    let fired = 0;
    const handle = clock.setTimeout(() => { fired++; }, 100);
    expect(clock.pendingHandles()).toBe(1);
    host.advance(99);
    expect(fired).toBe(0);
    host.advance(1);
    host.advance(1_000);
    expect(fired).toBe(1);
    expect(clock.pendingHandles()).toBe(0);
    handle.dispose();
    expect(clock.pendingHandles()).toBe(0);
  });

  it('cancels a pending timeout when its TimerHandle is disposed', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    let fired = 0;
    const handle = clock.setTimeout(() => { fired++; }, 100);
    handle.dispose();
    handle.dispose();
    host.advance(1_000);
    expect(fired).toBe(0);
    expect(host.liveTimers()).toBe(0);
    expect(clock.pendingHandles()).toBe(0);
  });

  it('repeats an interval until its TimerHandle is disposed', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    let ticks = 0;
    const handle = clock.setInterval(() => { ticks++; }, 10);
    host.advance(35);
    expect(ticks).toBe(3);
    expect(clock.pendingHandles()).toBe(1);
    handle.dispose();
    host.advance(100);
    expect(ticks).toBe(3);
    expect(host.liveTimers()).toBe(0);
  });

  it('treats negative and non-finite delays as zero', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    const fired: string[] = [];
    clock.setTimeout(() => { fired.push('negative'); }, -50);
    clock.setTimeout(() => { fired.push('nan'); }, Number.NaN);
    host.advance(0);
    expect(fired).toEqual(['negative', 'nan']);
  });

  it('queues microtasks on the host', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    let ran = false;
    clock.queueMicrotask(() => { ran = true; });
    expect(ran).toBe(false);
    host.flushMicrotasks();
    expect(ran).toBe(true);
  });

  it('schedules frames through the host frame hook and cancels them on dispose', () => {
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    const stamps: number[] = [];
    clock.requestFrame((timestampMs) => { stamps.push(timestampMs); });
    const cancelled = clock.requestFrame((timestampMs) => { stamps.push(-timestampMs); });
    expect(host.liveFrames()).toBe(2);
    expect(host.liveTimers()).toBe(0);
    cancelled.dispose();
    expect(host.liveFrames()).toBe(1);
    host.frame(16.5);
    expect(stamps).toEqual([16.5]);
    expect(clock.pendingHandles()).toBe(0);
  });

  it('falls back to a timer when the host has no frame hook', () => {
    const host = createFakeClockHost({ frames: false });
    const clock = createWebClock({ host, frameIntervalMs: 20 });
    const stamps: number[] = [];
    clock.requestFrame((timestampMs) => { stamps.push(timestampMs); });
    host.advance(19);
    expect(stamps).toEqual([]);
    host.advance(1);
    expect(stamps).toEqual([20]);
    expect(host.liveTimers()).toBe(0);
  });
});
