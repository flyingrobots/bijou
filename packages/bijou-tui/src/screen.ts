/**
 * ANSI escape sequences and helpers for terminal screen management.
 *
 * Provides low-level building blocks used by the TEA runtime to
 * enter/exit alternate screen mode and render flicker-free frames.
 *
 * @module screen
 */

import type { IOPort } from '@flyingrobots/bijou';

/** ANSI escape: enter alternate screen buffer (DEC Private Mode 1049). */
export const ENTER_ALT_SCREEN = '\x1b[?1049h';
/** ANSI escape: exit alternate screen buffer (DEC Private Mode 1049). */
export const EXIT_ALT_SCREEN = '\x1b[?1049l';
/** ANSI escape: hide the text cursor (DEC Private Mode 25). */
export const HIDE_CURSOR = '\x1b[?25l';
/** ANSI escape: show the text cursor (DEC Private Mode 25). */
export const SHOW_CURSOR = '\x1b[?25h';
/** ANSI escape: disable line wrapping (DEC Private Mode 7). */
export const WRAP_DISABLE = '\x1b[?7l';
/** ANSI escape: enable line wrapping (DEC Private Mode 7). */
export const WRAP_ENABLE = '\x1b[?7h';
/** ANSI escape: clear entire screen (ED 2). */
export const CLEAR_SCREEN = '\x1b[2J';
/** ANSI escape: clear from cursor to end of screen (ED 0). */
export const CLEAR_TO_END = '\x1b[J';
/** ANSI escape: clear from cursor to end of current line (EL 0). */
export const CLEAR_LINE_TO_END = '\x1b[K';
/** ANSI escape: move cursor to row 1, column 1 (CUP). */
export const HOME = '\x1b[H';
/** ANSI escape: clear entire current line (EL 2). */
export const CLEAR_LINE = '\x1b[2K';

/**
 * Enter alt screen buffer, hide cursor, disable wrap, and clear screen.
 *
 * @param io - The I/O port to write escape sequences to.
 */
export function enterScreen(io: IOPort): void {
  io.write(ENTER_ALT_SCREEN + HIDE_CURSOR + WRAP_DISABLE + CLEAR_SCREEN + HOME);
}

/**
 * Show cursor, enable wrap, and exit alt screen buffer.
 *
 * @param io - The I/O port to write escape sequences to.
 */
export function exitScreen(io: IOPort): void {
  io.write(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
}

/**
 * Clear screen and move cursor to home position.
 *
 * @param io - The I/O port to write escape sequences to.
 */
export function clearAndHome(io: IOPort): void {
  io.write(CLEAR_SCREEN + HOME);
}

/**
 * Flicker-free render: move cursor home, write content line-by-line,
 * clearing from the end of each line to the terminal edge.
 *
 * Disabling wrap in enterScreen() ensures the terminal won't scroll
 * if we write to the bottom-right cell.
 *
 * @param io      - The I/O port to write the composed frame to.
 * @param content - The rendered view string (may contain newlines).
 */
export function renderFrame(io: IOPort, content: string): void {
  const lines = content.split('\n');
  const frame = HOME + lines.map((line) => line + CLEAR_LINE_TO_END).join('\n') + CLEAR_TO_END;
  io.write(frame);
}
