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
      const result = await input({ title: 'Name', required: true, ctx });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).toContain('required');
      expect(result).toBe('');
    });

    it('required: true with non-empty input does not write error', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello'] } });
      const result = await input({ title: 'Name', required: true, ctx });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).not.toMatch(/required/i);
      expect(result).toBe('hello');
    });

    it('custom validator error is written', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['ab'] } });
      const result = await input({
        title: 'Code',
        validate: (v) => v.length < 3
          ? { valid: false, message: 'Too short' }
          : { valid: true },
        ctx,
      });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).toContain('Too short');
      expect(result).toBe('ab');
    });

    it('valid input does not write error', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello'] } });
      const result = await input({
        title: 'Code',
        validate: (v) => v.length >= 3
          ? { valid: true }
          : { valid: false, message: 'Too short' },
        ctx,
      });
      const allOutput = ctx.io.written.join('');
      expect(allOutput).not.toContain('Too short');
      expect(result).toBe('hello');
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter <title>"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['val'] } });
      const result = await input({ title: 'Username', ctx });
      expect(ctx.io.written[0]).toContain('Enter username');
      expect(result).toBe('val');
    });
  });

  describe('rich mode (interactive)', () => {
    it('prompt contains title', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: ['val'] } });
      await input({ title: 'Username', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Username');
    });
  });

  describe('empty / Ctrl+C behavior', () => {
    it('empty input in interactive mode returns empty string', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
      const result = await input({ title: 'Name', ctx });
      expect(result).toBe('');
    });

    it('empty input in interactive mode returns default when set', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
      const result = await input({ title: 'Name', defaultValue: 'fallback', ctx });
      expect(result).toBe('fallback');
    });
  });

  describe('edge cases', () => {
    it('handles 1000+ character input', async () => {
      const longStr = 'a'.repeat(1500);
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [longStr] } });
      const result = await input({ title: 'Data', ctx });
      expect(result).toBe(longStr);
      expect(result.length).toBe(1500);
    });

    it('handles emoji characters', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello 🎉🚀'] } });
      const result = await input({ title: 'Msg', ctx });
      expect(result).toBe('hello 🎉🚀');
    });

    it('handles CJK characters', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['你好世界'] } });
      const result = await input({ title: 'Text', ctx });
      expect(result).toBe('你好世界');
    });
  });
});
