import { describe, it, expect } from 'vitest';
import { animate } from './animate.js';
import type { CmdCapabilities } from './types.js';
import { must } from '@flyingrobots/bijou/adapters/test';

const noop = () => undefined;

/** Create mock capabilities that can be manually pulsed. */
function createMockCaps(): CmdCapabilities & { pulse(dt: number): void } {
  const handlers = new Set<(dt: number) => void>();
  return {
    onPulse: (h) => {
      handlers.add(h);
      return { dispose: () => handlers.delete(h) };
    },
    pulse: (dt) => {
      for (const h of handlers) h(dt);
    },
  };
}

describe('animate', () => {
  describe('immediate mode', () => {
      it('resolves with a single frame at the target value', async () => {
        const frames: number[] = [];
        const cmd = animate({
          from: 0,
          to: 100,
          immediate: true,
          onFrame: (v) => {
            frames.push(v);
            return v;
          },
        });
        const emitted: number[] = [];
        const caps = createMockCaps();
        await cmd((msg) => emitted.push(msg), caps);
        expect(frames).toEqual([100]);
        expect(emitted).toEqual([100]);
      });
    });

  describe('spring mode', () => {
      it('produces frames and settles at the target', async () => {
        const frames: number[] = [];
        const cmd = animate({
          from: 0,
          to: 100,
          spring: 'stiff',
          onFrame: (v) => {
            frames.push(v);
            return v;
          },
        });
        const emitted: number[] = [];
        const caps = createMockCaps();
        const s = { settled: false };
        const promise = Promise.resolve(cmd((msg) => emitted.push(msg), caps)).then(() => {
          s.settled = true;
        });
        for (let i = 0; i < 1000 && !s.settled; i++) {
          caps.pulse(0.016);
          await new Promise<void>((resolve) => { queueMicrotask(resolve); });
        }
        await promise;
        expect(frames.length).toBeGreaterThan(1);
        expect(emitted.length).toBeGreaterThan(1);
        expect(emitted).toEqual(frames);
        expect(must(frames[0])).toBeGreaterThan(0);
        expect(must(frames[0])).toBeLessThan(50);
      });
      it('defaults to spring type', async () => {
        const frames: number[] = [];
        const cmd = animate({
          from: 0,
          to: 10,
          onFrame: (v) => {
            frames.push(v);
            return v;
          },
        });
        const caps = createMockCaps();
        const s = { settled: false };
        const promise = Promise.resolve(cmd(noop, caps)).then(() => { s.settled = true; });
        for (let i = 0; i < 1000 && !s.settled; i++) {
          caps.pulse(0.016);
          await new Promise<void>((resolve) => { queueMicrotask(resolve); });
        }
        await promise;
        expect(frames.length).toBeGreaterThan(1);
      });
      it('keeps critically damped springs bounded under slow pulse frames', async () => {
        const frames: number[] = [];
        const target = 100;
        const cmd = animate({
          from: 0,
          to: target,
          spring: {
            mass: 1,
            stiffness: 144,
            damping: 24,
            precision: 0.01,
          },
          onFrame: (v) => {
            frames.push(v);
            return v;
          },
        });
        const caps = createMockCaps();
        const s = { settled: false };
        const promise = Promise.resolve(cmd(noop, caps)).then(() => {
          s.settled = true;
        });
        for (let i = 0; i < 240 && !s.settled; i++) {
          caps.pulse(1);
          await new Promise<void>((resolve) => { queueMicrotask(resolve); });
        }
        expect(s.settled).toBe(true);
        await promise;
        expect(frames.length).toBeGreaterThan(1);
        expect(must(frames[0])).toBeGreaterThan(0);
        expect(must(frames[0])).toBeLessThan(target);
        expect(frames.every((value) => Number.isFinite(value))).toBe(true);
        expect(frames.every((value) => value >= 0 && value <= target)).toBe(true);
        expect(frames.at(-1)).toBe(target);
      });
    });
});
