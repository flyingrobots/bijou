import type { IOPort } from '@flyingrobots/bijou';

export const ENTER_ALT_SCREEN = '\x1b[?1049h';
export const EXIT_ALT_SCREEN = '\x1b[?1049l';
export const HIDE_CURSOR = '\x1b[?25l';
export const SHOW_CURSOR = '\x1b[?25h';
export const CLEAR_SCREEN = '\x1b[2J';
export const CLEAR_TO_END = '\x1b[J';
export const HOME = '\x1b[H';
export const CLEAR_LINE = '\x1b[2K';

/** Enter alt screen buffer, hide cursor, and clear screen. */
export function enterScreen(io: IOPort): void {
  io.write(ENTER_ALT_SCREEN + HIDE_CURSOR + CLEAR_SCREEN + HOME);
}

/** Show cursor and exit alt screen buffer. */
export function exitScreen(io: IOPort): void {
  io.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
}

/** Clear screen and move cursor to home position. */
export function clearAndHome(io: IOPort): void {
  io.write(CLEAR_SCREEN + HOME);
}

/**
 * Flicker-free render: move cursor home, write content line-by-line
 * (clearing each line first), then erase everything below.
 */
export function renderFrame(io: IOPort, content: string): void {
  const lines = content.split('\n');
  let frame = HOME;
  for (const line of lines) {
    frame += CLEAR_LINE + line + '\n';
  }
  frame += CLEAR_TO_END;
  io.write(frame);
}
