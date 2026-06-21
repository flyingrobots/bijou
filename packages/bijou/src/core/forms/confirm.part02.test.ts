import { describe, it, expect } from 'vitest';
import { confirm } from './confirm.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('confirm()', () => {
  describe('NO_COLOR', () => {
      it('prompt uses bracket style without ANSI escapes', async () => {
        const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['y'] } });
        await confirm({ title: 'Continue?', ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('[Y/n]');
        expect(output).not.toMatch(new RegExp(`${String.fromCharCode(27)}\\[`, 'u'));
      });

      it('"y" returns true under noColor', async () => {
        const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['y'] } });
        expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
      });

      it('"n" returns false under noColor', async () => {
        const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['n'] } });
        expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
      });
    });

  it('accepts ctx parameter and uses it over default', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
      const result = await confirm({ title: 'OK?', ctx });
      expect(result).toBe(true);
      expect(ctx.io.written.length).toBeGreaterThan(0);
    });

  describe('Ctrl+C / cancellation', () => {
      it('rejected question() (Ctrl+C) propagates without crashing', async () => {
        const ctx = createTestContext({ mode: 'interactive' });
        ctx.io.question = () => Promise.reject(new Error('readline was closed'));
        await expect(confirm({ title: 'Continue?', ctx })).rejects.toThrow('readline was closed');
      });
    });

  describe('empty answer in interactive mode', () => {
      it('empty answer in interactive mode returns default (true)', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
        expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
      });

      it('empty answer in interactive mode returns default (false) when defaultValue is false', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
        expect(await confirm({ title: 'Continue?', defaultValue: false, ctx })).toBe(false);
      });
    });
});
