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
  WRAP_DISABLE,
  WRAP_ENABLE,
  CLEAR_SCREEN,
  CLEAR_TO_END,
  CLEAR_LINE_TO_END,
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
    expect(CLEAR_LINE_TO_END).toBe('\x1b[K');
    expect(HOME).toBe('\x1b[H');
    expect(WRAP_DISABLE).toBe('\x1b[?7l');
    expect(WRAP_ENABLE).toBe('\x1b[?7h');
  });

  it('enterScreen writes alt screen + hide cursor + wrap disable + clear + home', () => {
    const io = mockIO();
    enterScreen(io);
    expect(io.written).toEqual([ENTER_ALT_SCREEN + HIDE_CURSOR + WRAP_DISABLE + CLEAR_SCREEN + HOME]);
  });

  it('exitScreen writes show cursor + wrap enable + exit alt screen', () => {
    const io = mockIO();
    exitScreen(io);
    expect(io.written).toEqual([SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN]);
  });

  it('clearAndHome writes clear screen + home', () => {
    const io = mockIO();
    clearAndHome(io);
    expect(io.written).toEqual([CLEAR_SCREEN + HOME]);
  });

  it('renderFrame writes home + lines with clear-to-eol + clear-to-end', () => {
    const io = mockIO();
    renderFrame(io, 'hello\nworld');
    expect(io.written).toEqual([
      HOME + 'hello' + CLEAR_LINE_TO_END + '\n' + 'world' + CLEAR_LINE_TO_END + CLEAR_TO_END,
    ]);
  });
});
