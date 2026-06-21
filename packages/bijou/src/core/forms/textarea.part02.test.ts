import { describe, it, expect } from 'vitest';
import { textarea } from './textarea.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Ctrl+C returns defaultValue when set', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['\x03'] },
          });
          const result = await textarea({ title: 'Msg', defaultValue: 'fallback', ctx });
          expect(result).toBe('fallback');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('empty submit returns defaultValue when set', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['\x04'] },
          });
          const result = await textarea({ title: 'Msg', defaultValue: 'fallback', ctx });
          expect(result).toBe('fallback');
          const output = ctx.io.written.join('');
          expect(output).toContain('fallback');
          expect(output).not.toContain('(cancelled)');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Backspace deletes character', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', 'b', 'c', '\x7f', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('ab');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Backspace at start of line merges with previous', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            // type "a", Enter (new line), type "b", backspace (deletes "b"), backspace (merges empty line)
            io: { keys: ['a', '\r', 'b', '\x7f', '\x7f', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('a');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Backspace at start of first line does nothing', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['\x7f', 'a', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('a');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('arrow keys move cursor', async () => {
          // Type "ab", left, left, type "c" → "cab"
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', 'b', '\x1b[D', '\x1b[D', 'c', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('cab');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('right arrow at end of line wraps to next line', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            // type "a", Enter, type "b", Up (→ end of "a"), Right (wraps to start of "b"), type "x"
            io: { keys: ['a', '\r', 'b', '\x1b[A', '\x1b[C', 'x', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('a\nxb');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
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
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
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
  });
});
