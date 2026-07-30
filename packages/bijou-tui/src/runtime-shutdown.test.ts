import { mockClock } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import { drainWithin } from './runtime-shutdown.js';

describe('runtime shutdown', () => {
  it('consumes drain rejection and settles without waiting for timeout', async () => {
    const clock = mockClock();
    const result = drainWithin({
      drain: () => Promise.reject(new Error('drain failed')),
    }, clock, 1_000);

    await clock.advanceByAsync(0);

    await expect(result).resolves.toBe('drained');
  });
});
