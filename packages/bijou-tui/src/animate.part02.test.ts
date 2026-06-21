import { describe, it, expect } from 'vitest';
import { animate } from './animate.js';
import type { CmdCapabilities } from './types.js';

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
