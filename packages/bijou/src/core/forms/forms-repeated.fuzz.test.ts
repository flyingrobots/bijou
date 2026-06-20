import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { input } from './input.js';

describe('forms fuzz repeated calls', () => {
  it('50 sequential input() calls all resolve', async () => {
    const answers = Array.from({ length: 50 }, (_, i) => `answer-${String(i)}`);
    const ctx = createTestContext({ mode: 'pipe', io: { answers } });
    const results: string[] = [];
    for (let i = 0; i < 50; i++) {
      results.push(await input({ title: `q${String(i)}`, ctx }));
    }
    expect(results).toHaveLength(50);
    expect(results[0]).toBe('answer-0');
    expect(results[49]).toBe('answer-49');
  });
});
