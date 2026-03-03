/**
 * noColor integration tests for all form components.
 *
 * Each interactive form is rendered with `noColor: true` and asserted
 * to contain zero SGR color sequences. Question-based forms (input,
 * confirm) are asserted to contain zero ANSI escapes of any kind.
 */

import { describe, expect, it } from 'vitest';
import { createTestContext, expectNoAnsi, expectNoAnsiSgr } from '../../adapters/test/index.js';
import { select } from './select.js';
import { multiselect } from './multiselect.js';
import { filter } from './filter.js';
import { textarea } from './textarea.js';
import { input } from './input.js';
import { confirm } from './confirm.js';

/** Join all writes into a single string. */
function allWritten(ctx: { io: { written: string[] } }): string {
  return ctx.io.written.join('');
}

const noColorInteractive = {
  noColor: true,
  mode: 'interactive' as const,
  runtime: { stdinIsTTY: true },
};

describe('noColor integration', () => {
  describe('select()', () => {
    it('emits no SGR when selecting first item', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['\r'] },
      });
      const result = await select({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expect(result).toBe('a');
      expectNoAnsiSgr(allWritten(ctx));
    });

    it('emits no SGR when navigating then selecting', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['\x1b[B', '\r'] },
      });
      const result = await select({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expect(result).toBe('b');
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('multiselect()', () => {
    it('emits no SGR when toggling and confirming', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: [' ', '\r'] },
      });
      const result = await multiselect({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expect(result).toEqual(['a']);
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('filter()', () => {
    it('emits no SGR when typing and confirming', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['a', '\r'] },
      });
      const result = await filter({
        title: 'Search',
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana' },
        ],
        ctx,
      });
      expect(result).toBe('apple');
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('textarea()', () => {
    it('emits no SGR when typing and submitting', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['h', 'i', '\x04'] },
      });
      const result = await textarea({
        title: 'Notes',
        ctx,
      });
      expect(result).toBe('hi');
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('input()', () => {
    it('emits no ANSI at all', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { answers: ['test'] },
      });
      const result = await input({ title: 'Name', ctx });
      expect(result).toBe('test');
      expectNoAnsi(allWritten(ctx));
    });
  });

  describe('confirm()', () => {
    it('emits no ANSI at all', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { answers: ['y'] },
      });
      const result = await confirm({ title: 'OK?', ctx });
      expect(result).toBe(true);
      expectNoAnsi(allWritten(ctx));
    });
  });
});
