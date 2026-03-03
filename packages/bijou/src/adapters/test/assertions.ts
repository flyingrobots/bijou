/**
 * Test assertion helpers for ANSI escape and output validation.
 *
 * These helpers import `vitest` and are intended for test files only —
 * they are NOT exported from the main bijou barrel.
 *
 * @module adapters/test/assertions
 */

import { expect } from 'vitest';
import type { TestContext } from './index.js';

/** Matches any ANSI escape: CSI (`\x1b[`) or OSC (`\x1b]`). */
const ANSI_RE = /\x1b[[\]]/;

/** Matches SGR color/style sequences (`\x1b[<digits>m`) but not cursor control. */
const SGR_RE = /\x1b\[\d+(?:;\d+)*m/;

/**
 * Assert that the output contains no ANSI escapes at all (no CSI, no OSC).
 *
 * @param output - The string to check.
 */
export function expectNoAnsi(output: string): void {
  expect(output).not.toMatch(ANSI_RE);
}

/**
 * Assert that the output contains no SGR color/style sequences.
 *
 * Allows cursor-control escapes like `\x1b[?25l` (hide cursor),
 * `\x1b[K` (clear line), and `\x1b[3A` (move up). Only rejects
 * sequences of the form `\x1b[<digits>m`.
 *
 * @param output - The string to check.
 */
export function expectNoAnsiSgr(output: string): void {
  expect(output).not.toMatch(SGR_RE);
}

/**
 * Assert that the output contains at least one ANSI escape sequence.
 *
 * @param output - The string to check.
 */
export function expectContainsAnsi(output: string): void {
  expect(output).toMatch(ANSI_RE);
}

/**
 * Assert that the output contains the hide-cursor sequence (`\x1b[?25l`).
 *
 * @param output - The string to check.
 */
export function expectHiddenCursor(output: string): void {
  expect(output).toContain('\x1b[?25l');
}

/**
 * Assert that the output contains the show-cursor sequence (`\x1b[?25h`).
 *
 * @param output - The string to check.
 */
export function expectShownCursor(output: string): void {
  expect(output).toContain('\x1b[?25h');
}

/**
 * Assert that the combined written output of a test context contains a substring.
 *
 * @param ctx - A test context with a mock IO adapter.
 * @param substring - The substring to search for in the joined output.
 */
export function expectWritten(ctx: TestContext, substring: string): void {
  expect(ctx.io.written.join('')).toContain(substring);
}
