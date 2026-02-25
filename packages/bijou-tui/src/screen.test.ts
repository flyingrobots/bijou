import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import {
  enterScreen,
  exitScreen,
  clearAndHome,
  renderFrame,
  ENTER_ALT_SCREEN,
  EXIT_ALT_SCREEN,
  HIDE_CURSOR,
  SHOW_CURSOR,
  CLEAR_SCREEN,
  CLEAR_TO_END,
  CLEAR_LINE,
  HOME,
} from './screen.js';

describe('screen', () => {
  it('ANSI constants are correct escape sequences', () => {
    expect(ENTER_ALT_SCREEN).toBe('\x1b[?1049h');
    expect(EXIT_ALT_SCREEN).toBe('\x1b[?1049l');
    expect(HIDE_CURSOR).toBe('\x1b[?25l');
    expect(SHOW_CURSOR).toBe('\x1b[?25h');
    expect(CLEAR_SCREEN).toBe('\x1b[2J');
    expect(CLEAR_TO_END).toBe('\x1b[J');
    expect(CLEAR_LINE).toBe('\x1b[2K');
    expect(HOME).toBe('\x1b[H');
  });

  it('enterScreen writes alt screen + hide cursor + clear + home', () => {
    const io = mockIO();
    enterScreen(io);
    expect(io.written).toEqual([ENTER_ALT_SCREEN + HIDE_CURSOR + CLEAR_SCREEN + HOME]);
  });

  it('exitScreen writes show cursor + exit alt screen', () => {
    const io = mockIO();
    exitScreen(io);
    expect(io.written).toEqual([SHOW_CURSOR + EXIT_ALT_SCREEN]);
  });

  it('clearAndHome writes clear screen + home', () => {
    const io = mockIO();
    clearAndHome(io);
    expect(io.written).toEqual([CLEAR_SCREEN + HOME]);
  });

  it('renderFrame writes home + clear-line per line + clear-to-end', () => {
    const io = mockIO();
    renderFrame(io, 'hello\nworld');
    expect(io.written).toEqual([
      HOME + CLEAR_LINE + 'hello\n' + CLEAR_LINE + 'world\n' + CLEAR_TO_END,
    ]);
  });
});
