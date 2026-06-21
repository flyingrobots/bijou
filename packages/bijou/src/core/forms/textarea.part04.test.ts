import { describe, it, expect } from 'vitest';
import { textarea } from './textarea.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('placeholder renders when buffer is empty', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['\x04'] },
          });
          await textarea({ title: 'Msg', placeholder: 'Type here...', ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('Type here...');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('sanitizes non-finite sizing and maxLength inputs', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', 'b', 'c', '\x04'] },
          });
          const result = await textarea({
            title: 'Msg',
            width: Number.NaN,
            height: Number.POSITIVE_INFINITY,
            maxLength: Number.NaN,
            ctx,
          });

          expect(result).toBe('abc');
          expect(ctx.io.written.join('')).not.toContain('NaN');
        });
  });
});
