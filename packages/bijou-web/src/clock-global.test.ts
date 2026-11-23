import { describe, expect, it } from 'vitest';
import { createWebClock } from './index.js';

describe('createWebClock() on the global host without a window', () => {
  it('runs where window, document, and requestAnimationFrame are undefined', () => {
    expect(Reflect.has(globalThis, 'window')).toBe(false);
    expect(Reflect.has(globalThis, 'document')).toBe(false);
    expect(Reflect.has(globalThis, 'requestAnimationFrame')).toBe(false);
    const before = Date.now();
    const clock = createWebClock();
    expect(clock.now()).toBeGreaterThanOrEqual(before);
    expect(clock.date(0).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(clock.monotonicNow()).toBeGreaterThanOrEqual(0);
  });

  it('fires real timeouts, intervals, microtasks, and fallback frames', async () => {
    const clock = createWebClock({ frameIntervalMs: 1 });
    const events: string[] = [];
    await new Promise<void>((resolve) => {
      clock.queueMicrotask(() => { events.push('microtask'); });
      clock.requestFrame((timestampMs) => { events.push(typeof timestampMs); });
      let ticks = 0;
      const interval = clock.setInterval(() => {
        ticks++;
        if (ticks < 2) return;
        interval.dispose();
        clock.setTimeout(resolve, 5);
      }, 1);
    });
    expect(events).toEqual(['microtask', 'number']);
    expect(clock.pendingHandles()).toBe(0);
  });

  it('uses a global requestAnimationFrame when the host provides one', () => {
    const requested: ((timestampMs: number) => void)[] = [];
    const cancelled: number[] = [];
    Reflect.set(globalThis, 'requestAnimationFrame', (callback: (timestampMs: number) => void) => requested.push(callback));
    Reflect.set(globalThis, 'cancelAnimationFrame', (id: number) => { cancelled.push(id); });
    try {
      const clock = createWebClock();
      const stamps: number[] = [];
      clock.requestFrame((timestampMs) => { stamps.push(timestampMs); });
      clock.requestFrame((timestampMs) => { stamps.push(timestampMs); }).dispose();
      expect(requested).toHaveLength(2);
      expect(cancelled).toEqual([2]);
      requested[0]?.(42);
      expect(stamps).toEqual([42]);
      expect(clock.pendingHandles()).toBe(0);
    } finally {
      Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
      Reflect.deleteProperty(globalThis, 'cancelAnimationFrame');
    }
  });
});
