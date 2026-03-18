import { describe, it, expect } from 'vitest';
import { mockClock } from '@flyingrobots/bijou/adapters/test';
import { quit, tick, batch } from './commands.js';
import { QUIT } from './types.js';

function createClockCapabilities() {
  const clock = mockClock();
  return {
    clock,
    caps: {
      onPulse: () => ({ dispose() {} }),
      sleep(ms: number) {
        return new Promise<void>((resolve) => {
          clock.setTimeout(resolve, ms);
        });
      },
    },
  };
}

describe('commands', () => {
  describe('quit', () => {
    it('returns a function that resolves to QUIT symbol', async () => {
      const cmd = quit();
      const result = await cmd(() => {}, { onPulse: () => ({ dispose() {} }) });
      expect(result).toBe(QUIT);
    });
  });

  describe('tick', () => {
    it('resolves with the message after the delay', async () => {
      const { clock, caps } = createClockCapabilities();
      const msg = { type: 'tick' as const };
      const cmd = tick(100, msg);
      const promise = cmd(() => {}, caps);
      await clock.advanceByAsync(100);
      const result = await promise;
      expect(result).toBe(msg);
    });

    it('does not resolve before the delay', async () => {
      const { clock, caps } = createClockCapabilities();
      const cmd = tick(500, 'done');
      let resolved = false;
      void cmd(() => {}, caps).then(() => {
        resolved = true;
      });
      await clock.advanceByAsync(499);
      expect(resolved).toBe(false);
      await clock.advanceByAsync(1);
      expect(resolved).toBe(true);
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
