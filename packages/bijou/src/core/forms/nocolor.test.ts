/**
 * noColor integration tests for all form components.
 *
 * Each interactive form is rendered with `noColor: true` and asserted
 * to contain zero SGR color sequences. Question-based forms (input,
 * confirm) are asserted to contain zero ANSI escapes of any kind.
 */

import { describe, it } from 'vitest';
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
      await select({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expectNoAnsiSgr(allWritten(ctx));
    });

    it('emits no SGR when navigating then selecting', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['\x1b[B', '\r'] },
      });
      await select({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('multiselect()', () => {
    it('emits no SGR when toggling and confirming', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: [' ', '\r'] },
      });
      await multiselect({
        title: 'Pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
        ctx,
      });
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('filter()', () => {
    it('emits no SGR when typing and confirming', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['a', '\r'] },
      });
      await filter({
        title: 'Search',
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana' },
        ],
        ctx,
      });
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('textarea()', () => {
    it('emits no SGR when typing and submitting', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { keys: ['h', 'i', '\x04'] },
      });
      await textarea({
        title: 'Notes',
        ctx,
      });
      expectNoAnsiSgr(allWritten(ctx));
    });
  });

  describe('input()', () => {
    it('emits no ANSI at all', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { answers: ['test'] },
      });
      await input({ title: 'Name', ctx });
      expectNoAnsi(allWritten(ctx));
    });
  });

  describe('confirm()', () => {
    it('emits no ANSI at all', async () => {
      const ctx = createTestContext({
        ...noColorInteractive,
        io: { answers: ['y'] },
      });
      await confirm({ title: 'OK?', ctx });
      expectNoAnsi(allWritten(ctx));
    });
  });
});
