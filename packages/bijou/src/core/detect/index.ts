/**
 * Environment detection utilities.
 *
 * Re-exports TTY / output-mode detection from the `tty` sub-module.
 * @module
 */

export { detectOutputMode, detectColorScheme } from './tty.js';
export type { OutputMode, ColorScheme } from './tty.js';
