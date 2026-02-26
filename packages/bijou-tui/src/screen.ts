import type { IOPort } from '@flyingrobots/bijou';

export const ENTER_ALT_SCREEN = '\x1b[?1049h';
export const EXIT_ALT_SCREEN = '\x1b[?1049l';
export const HIDE_CURSOR = '\x1b[?25l';
export const SHOW_CURSOR = '\x1b[?25h';
export const WRAP_DISABLE = '\x1b[?7l';
export const WRAP_ENABLE = '\x1b[?7h';
export const CLEAR_SCREEN = '\x1b[2J';
export const CLEAR_TO_END = '\x1b[J';
export const CLEAR_LINE_TO_END = '\x1b[K';
export const HOME = '\x1b[H';
export const CLEAR_LINE = '\x1b[2K';

/** Enter alt screen buffer, hide cursor, disable wrap, and clear screen. */
export function enterScreen(io: IOPort): void {
  io.write(ENTER_ALT_SCREEN + HIDE_CURSOR + WRAP_DISABLE + CLEAR_SCREEN + HOME);
}

/** Show cursor, enable wrap, and exit alt screen buffer. */
export function exitScreen(io: IOPort): void {
  io.write(SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN);
}

/** Clear screen and move cursor to home position. */
export function clearAndHome(io: IOPort): void {
  io.write(CLEAR_SCREEN + HOME);
}

/**
 * Flicker-free render: move cursor home, write content line-by-line,
 * clearing from the end of each line to the terminal edge.
 *
 * Disabling wrap in enterScreen() ensures the terminal won't scroll
 * if we write to the bottom-right cell.
 */
export function renderFrame(io: IOPort, content: string): void {
  const lines = content.split('\n');
  const frame = HOME + lines.map((line) => line + CLEAR_LINE_TO_END).join('\n') + CLEAR_TO_END;
  io.write(frame);
}
