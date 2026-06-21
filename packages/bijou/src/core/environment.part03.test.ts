import { describe, it, expect } from 'vitest';
import { createTestContext, expectNoAnsi } from '../adapters/test/index.js';
import { confirm } from './forms/confirm.js';
import { input } from './forms/input.js';
import { multiselect } from './forms/multiselect.js';

describe('form fallback in pipe mode', () => {
  it('confirm() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
    const result = await confirm({ title: 'OK?', ctx });
    expect(result).toBe(true);
    expectNoAnsi(ctx.io.written.join(''));
  });

  it('input() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello'] } });
    const result = await input({ title: 'Name', ctx });
    expect(result).toBe('hello');
    expectNoAnsi(ctx.io.written.join(''));
  });

  it('multiselect() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1,2'] } });
    const result = await multiselect({
      title: 'Pick',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' },
      ],
      ctx,
    });
    expect(result).toEqual(['a', 'b']);
  });
});
