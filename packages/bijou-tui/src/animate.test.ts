import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { animate, sequence } from './animate.js';
import type { CmdCapabilities } from './types.js';
import { must } from '@flyingrobots/bijou/adapters/test';

const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), 'animate.ts');
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

function docsForInternalCommand(source: string, functionName: string): string {
  const functionIndex = source.indexOf(`function ${functionName}`);
  if (functionIndex < 0) {
    return '';
  }
  const beforeFunction = source.slice(0, functionIndex);
  const docStart = beforeFunction.lastIndexOf('/**');
  if (docStart < 0) {
    return '';
  }
  return beforeFunction.slice(docStart);
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
  describe('tween mode', () => {
    it('produces frames over the specified duration', async () => {
      const frames: number[] = [];
      const cmd = animate({
        type: 'tween',
        from: 0,
        to: 100,
        duration: 200,
        onFrame: (v) => {
          frames.push(v);
          return v;
        },
      });
      const caps = createMockCaps();
      const promise = cmd(noop, caps);
      for (let i = 0; i < 11; i++) {
        caps.pulse(0.02);
      }
      await promise;
      expect(frames.length).toBeGreaterThan(1);
    });
    it('respects immediate flag in tween mode too', async () => {
      const frames: number[] = [];
      const cmd = animate({
        type: 'tween',
        from: 0,
        to: 50,
        duration: 1000,
        immediate: true,
        onFrame: (v) => {
          frames.push(v);
          return v;
        },
      });
      const emitted: number[] = [];
      const caps = createMockCaps();
      await cmd((msg) => emitted.push(msg), caps);
      expect(frames).toEqual([50]);
      expect(emitted).toEqual([50]);
    });
  });
});
describe('animation command docs', () => {
  it('documents pulse-driven spring and tween commands', () => {
    const source = readFileSync(sourcePath, 'utf8');
    const springDocs = docsForInternalCommand(source, 'createSpringCmd');
    const tweenDocs = docsForInternalCommand(source, 'createTweenCmd');
    expect(springDocs).toContain('runtime pulses');
    expect(springDocs).toContain('fixed-step');
    expect(springDocs).toContain('maxPulseSeconds');
    expect(tweenDocs).toContain('pulse');
    expect(tweenDocs).toContain('dt');
    for (const docs of [springDocs, tweenDocs]) {
      expect(docs).not.toContain('setInterval');
      expect(docs).not.toContain('Date.now');
      expect(docs).not.toContain('@param fps');
    }
  });
});
describe('sequence', () => {
  it('runs commands in order', async () => {
    const order: string[] = [];
    const caps = createMockCaps();
    const cmd = sequence<string>(
      (emit) => { order.push('first'); emit('a'); return undefined; },
      (emit) => { order.push('second'); emit('b'); return undefined; },
    );
    const emitted: string[] = [];
    await cmd((msg) => emitted.push(msg), caps);
    expect(order).toEqual(['first', 'second']);
    expect(emitted).toEqual(['a', 'b']);
  });
});
