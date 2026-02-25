import { describe, it, expect, vi } from 'vitest';
import { quit, tick, batch } from './commands.js';
import { QUIT } from './types.js';

describe('commands', () => {
  describe('quit', () => {
    it('returns a function that resolves to QUIT symbol', async () => {
      const cmd = quit();
      const result = await cmd();
      expect(result).toBe(QUIT);
    });
  });

  describe('tick', () => {
    it('resolves with the message after the delay', async () => {
      vi.useFakeTimers();
      const msg = { type: 'tick' as const };
      const cmd = tick(100, msg);
      const promise = cmd();
      vi.advanceTimersByTime(100);
      const result = await promise;
      expect(result).toBe(msg);
      vi.useRealTimers();
    });

    it('does not resolve before the delay', async () => {
      vi.useFakeTimers();
      const cmd = tick(500, 'done');
      let resolved = false;
      void cmd().then(() => { resolved = true; });
      vi.advanceTimersByTime(499);
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);
      vi.advanceTimersByTime(1);
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('batch', () => {
    it('returns the commands as an array', () => {
      const a = quit();
      const b = quit();
      const result = batch(a, b);
      expect(result).toEqual([a, b]);
    });

    it('returns empty array for no args', () => {
      expect(batch()).toEqual([]);
    });
  });
});
