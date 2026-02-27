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

    it('returns trimmed answer', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['  hello world  '] } });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('hello world');
    });

    it('returns default when input is empty', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      const result = await textarea({ title: 'Msg', defaultValue: 'fallback', ctx });
      expect(result).toBe('fallback');
    });

    it('returns empty string when no input and no default', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('');
    });

    it('required: true writes error for empty input', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      await textarea({ title: 'Msg', required: true, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('required');
    });

    it('custom validator error is written', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['ab'] } });
      await textarea({
        title: 'Msg',
        validate: (v) => v.length < 3
          ? { valid: false, message: 'Too short' }
          : { valid: true },
        ctx,
      });
      const output = ctx.io.written.join('');
      expect(output).toContain('Too short');
    });
  });

  describe('pipe mode', () => {
    it('accepts text from stdin', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['some text'] } });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('some text');
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter text"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['text'] } });
      await textarea({ title: 'Msg', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Enter text');
    });
  });

  describe('interactive mode', () => {
    it('typing characters and submitting with Ctrl+D', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['h', 'i', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('hi');
    });

    it('Enter creates a new line', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', '\r', 'b', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a\nb');
    });

    it('Ctrl+C cancels and returns default or empty', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['h', 'i', '\x03'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('');
    });

    it('Ctrl+C returns defaultValue when set', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x03'] },
      });
      const result = await textarea({ title: 'Msg', defaultValue: 'fallback', ctx });
      expect(result).toBe('fallback');
    });

    it('Backspace deletes character', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', 'b', 'c', '\x7f', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('ab');
    });

    it('Backspace at start of line merges with previous', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        // type "a", Enter (new line), type "b", backspace (deletes "b"), backspace (merges empty line)
        io: { keys: ['a', '\r', 'b', '\x7f', '\x7f', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a');
    });

    it('Backspace at start of first line does nothing', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x7f', 'a', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a');
    });

    it('arrow keys move cursor', async () => {
      // Type "ab", left, left, type "c" → "cab"
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', 'b', '\x1b[D', '\x1b[D', 'c', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('cab');
    });

    it('right arrow at end of line wraps to next line', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        // type "a", Enter, type "b", Up (→ end of "a"), Right (wraps to start of "b"), type "x"
        io: { keys: ['a', '\r', 'b', '\x1b[A', '\x1b[C', 'x', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a\nxb');
    });

    it('left arrow at start of line wraps to previous line', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', '\r', '\x1b[D', 'x', '\x04'] },
      });
      // Start: lines=["a",""], cursor at (1,0)
      // Left → wraps to (0,1) (end of "a")
      // Type "x" → lines=["ax",""]
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('ax\n');
    });

    it('up/down arrow navigation clamps cursor column', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', 'b', 'c', '\r', 'x', '\x1b[A', '\x04'] },
      });
      // Lines: ["abc", "x"], cursor starts at (1,1) after typing "x"
      // Up → (0, min(1, 3)) = (0,1)
      // Submit → "abc\nx"
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('abc\nx');
    });

    it('maxLength prevents insertion beyond limit', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', 'b', 'c', 'd', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', maxLength: 3, ctx });
      expect(result).toBe('abc');
    });

    it('cleanup shows line count for multiline', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', '\r', 'b', '\r', 'c', '\x04'] },
      });
      await textarea({ title: 'Msg', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('3 lines');
    });

    it('cleanup shows (cancelled) on Ctrl+C', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x03'] },
      });
      await textarea({ title: 'Msg', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('(cancelled)');
    });

    it('down arrow beyond last line does nothing', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', '\x1b[B', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a');
    });

    it('up arrow at first line does nothing', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['a', '\x1b[A', '\x04'] },
      });
      const result = await textarea({ title: 'Msg', ctx });
      expect(result).toBe('a');
    });
  });
});
