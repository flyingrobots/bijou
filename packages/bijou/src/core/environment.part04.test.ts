import { describe, it, expect } from 'vitest';
import { createTestContext } from '../adapters/test/index.js';
import { confirm } from './forms/confirm.js';
import { input } from './forms/input.js';
import { multiselect } from './forms/multiselect.js';

describe('form fallback in accessible mode', () => {
  it('confirm() uses text prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['yes'] } });
    const result = await confirm({ title: 'OK?', ctx });
    expect(result).toBe(true);
    const output = ctx.io.written.join('');
    expect(output).toContain('Type yes or no');
  });

  it('input() uses descriptive prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['val'] } });
    const result = await input({ title: 'Username', ctx });
    expect(result).toBe('val');
    const output = ctx.io.written.join('');
    expect(output).toContain('Enter username');
  });

  it('multiselect() uses number prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
    const result = await multiselect({
      title: 'Pick',
      options: [{ label: 'A', value: 'a' }],
      ctx,
    });
    expect(result).toEqual(['a']);
    const output = ctx.io.written.join('');
    expect(output).toContain('Enter numbers separated by commas');
  });
});
