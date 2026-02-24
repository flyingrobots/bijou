import { describe, it, expect } from 'vitest';
import { input } from './input.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('input()', () => {
  describe('pipe mode', () => {
    it('captures typed input and returns trimmed string', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['  alice  '] } });
      const result = await input({ title: 'Name', ctx });
      expect(result).toBe('alice');
    });

    it('returns default when input is empty and default is set', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      const result = await input({ title: 'Name', defaultValue: 'bob', ctx });
      expect(result).toBe('bob');
    });

    it('returns empty string when no input and no default', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      const result = await input({ title: 'Name', ctx });
      expect(result).toBe('');
    });

    it('prompt contains title', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['x'] } });
      await input({ title: 'Username', ctx });
      expect(ctx.io.written[0]).toContain('Username');
    });

    it('prompt shows default value hint', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      await input({ title: 'Name', defaultValue: 'bob', ctx });
      expect(ctx.io.written[0]).toContain('bob');
    });
  });

  describe('validation', () => {
    it('required: true writes error for empty input', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      await input({ title: 'Name', required: true, ctx });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).toContain('required');
    });

    it('custom validator error is written', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['ab'] } });
      await input({
        title: 'Code',
        validate: (v) => v.length < 3
          ? { valid: false, message: 'Too short' }
          : { valid: true },
        ctx,
      });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).toContain('Too short');
    });

    it('valid input does not write error', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello'] } });
      await input({
        title: 'Code',
        validate: (v) => v.length >= 3
          ? { valid: true }
          : { valid: false, message: 'Too short' },
        ctx,
      });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).not.toContain('Too short');
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter <title>"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['val'] } });
      await input({ title: 'Username', ctx });
      expect(ctx.io.written[0]).toContain('Enter username');
    });
  });
});
