import { describe, it, expect } from 'vitest';
import { animate, sequence } from './animate.js';

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
      await cmd((msg) => emitted.push(msg as number));
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
        fps: 60,
        spring: 'stiff',
        onFrame: (v) => {
          frames.push(v);
          return v;
        },
      });

      const emitted: number[] = [];
      await cmd((msg) => emitted.push(msg as number));
      expect(frames.length).toBeGreaterThan(1);
      expect(emitted.length).toBeGreaterThan(1);
      expect(emitted).toEqual(frames);
      // Values should start near 0 and end at 100
      expect(frames[0]!).toBeGreaterThan(0);
      expect(frames[0]!).toBeLessThan(50);
    }, 10_000);

    it('defaults to spring type', async () => {
      const frames: number[] = [];
      const cmd = animate({
        from: 0,
        to: 10,
        fps: 60,
        onFrame: (v) => {
          frames.push(v);
          return v;
        },
      });

      await cmd(() => {});
      expect(frames.length).toBeGreaterThan(1);
    }, 10_000);
  });

  describe('tween mode', () => {
    it('produces frames over the specified duration', async () => {
      const frames: number[] = [];
      const cmd = animate({
        type: 'tween',
        from: 0,
        to: 100,
        duration: 200,
        fps: 30,
        onFrame: (v) => {
          frames.push(v);
          return v;
        },
      });

      await cmd(() => {});
      expect(frames.length).toBeGreaterThan(1);
    }, 5_000);

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
      await cmd((msg) => emitted.push(msg as number));
      expect(frames).toEqual([50]);
      expect(emitted).toEqual([50]);
    });
  });
});

describe('sequence', () => {
  it('runs commands in order', async () => {
    const order: string[] = [];

    const cmd = sequence(
      async (emit) => {
        order.push('first');
        emit('a');
      },
      async (emit) => {
        order.push('second');
        emit('b');
      },
    );

    const emitted: string[] = [];
    await cmd((msg) => emitted.push(msg as string));
    expect(order).toEqual(['first', 'second']);
    expect(emitted).toEqual(['a', 'b']);
  });
});
