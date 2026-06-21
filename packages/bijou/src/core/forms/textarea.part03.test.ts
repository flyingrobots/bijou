import { describe, it, expect } from 'vitest';
import { textarea } from './textarea.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('maxLength prevents insertion beyond limit', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', 'b', 'c', 'd', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', maxLength: 3, ctx });
          expect(result).toBe('abc');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('maxLength prevents Enter newline when at limit', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', 'b', 'c', '\r', 'd', '\x04'] },
          });
          // maxLength=3: "abc" is 3 chars, Enter would add \n (4th char) — blocked
          const result = await textarea({ title: 'Msg', maxLength: 3, ctx });
          expect(result).toBe('abc');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('cleanup shows line count for multiline', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', '\r', 'b', '\r', 'c', '\x04'] },
          });
          await textarea({ title: 'Msg', ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('3 lines');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('cleanup shows (cancelled) on Ctrl+C', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['\x03'] },
          });
          await textarea({ title: 'Msg', ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('(cancelled)');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('down arrow beyond last line does nothing', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', '\x1b[B', '\x04'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('a');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
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

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('Escape cancels and returns empty', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['h', 'i', '\x1b'] },
          });
          const result = await textarea({ title: 'Msg', ctx });
          expect(result).toBe('');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('showLineNumbers renders line numbers with gutter', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', '\r', 'b', '\x04'] },
          });
          await textarea({ title: 'Msg', showLineNumbers: true, ctx });
          const output = ctx.io.written.join('');
          expect(output).toContain('│');
        });
  });
});

describe('textarea()', () => {
  describe('interactive mode', () => {
    it('height option scrolls for many lines', async () => {
          const ctx = createTestContext({
            mode: 'interactive',
            io: { keys: ['a', '\r', 'b', '\r', 'c', '\r', 'd', '\r', 'e', '\x04'] },
          });
          await textarea({ title: 'Msg', height: 2, ctx });
          const output = ctx.io.written.join('');
          // Status should show a high line number (Ln 5)
          expect(output).toContain('Ln 5');
        });
  });
});
