/**
 * Shared ANSI escape sequence constants.
 *
 * Centralizes raw escape strings that were previously inlined
 * across spinner, progress, timer, form, and cursor-guard modules.
 *
 * @module core/ansi
 */

/** Carriage return + clear to end of line. Used by animated components to overwrite the current line. */
export const CLEAR_LINE_RETURN = '\r\x1b[K';

/** ANSI escape: hide the text cursor (DEC Private Mode 25). */
export const HIDE_CURSOR = '\x1b[?25l';

/** ANSI escape: show the text cursor (DEC Private Mode 25). */
export const SHOW_CURSOR = '\x1b[?25h';

/** ANSI escape: reset SGR style state. */
export const RESET_SGR = '\x1b[0m';
