import { describe, it, expect } from 'vitest';
import { textarea } from './textarea.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('renders title and prompt', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: ['hello'] } });
          await textarea({ title: 'Message', ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('Message');
        });
  });
});

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('returns trimmed answer', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: ['  hello world  '] } });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('hello world');
        });
  });
});

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('returns default when input is empty', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
          const result = await textarea({ title: 'Msg', defaultValue: 'fallback', ctx });
          expect(result).toBe('fallback');
        });
  });
});

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('returns empty string when no input and no default', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('');
        });
  });
});

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('required: true writes error for empty input', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
          const result = await textarea({ title: 'Msg', required: true, ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('required');
          expect(result).toBe('');
        });
  });
});

describe('textarea()', () => {
  describe('fallback (non-interactive)', () => {
    it('custom validator error is written', async () => {
          const ctx = createTestContext({ mode: 'static', io: { answers: ['ab'] } });
          const result = await textarea({
            title: 'Msg',
            validate: (v) => v.length < 3
              ? { valid: false, message: 'Too short' }
              : { valid: true },
            ctx,
          });
          const output = ctx.io.written.join('');
          expect(output).toContain('Too short');
          expect(result).toBe('ab');
        });
  });
});

describe('textarea()', () => {
  describe('pipe mode', () => {
    it('accepts text from stdin', async () => {
          const ctx = createTestContext({ mode: 'pipe', io: { answers: ['some text'] } });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('some text');
        });
  });
});

describe('textarea()', () => {
  describe('accessible mode', () => {
    it('prompt says "Enter text"', async () => {
          const ctx = createTestContext({ mode: 'accessible', io: { answers: ['text'] } });
          await textarea({ title: 'Msg', ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('Enter text');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('typing characters and submitting with Ctrl+D', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['h', 'i', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('hi');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Enter creates a new line', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', '\r', 'b', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('a\nb');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Ctrl+C cancels and returns default or empty', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['h', 'i', '\x03'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('');
          expect(result).not.toBe('hi');
        });
  });
});
