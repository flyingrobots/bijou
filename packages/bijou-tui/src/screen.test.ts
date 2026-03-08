import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import {
  enterScreen,
  exitScreen,
  clearAndHome,
  renderFrame,
  setCursorStyle,
  resetCursorStyle,
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
  CURSOR_BLOCK,
  CURSOR_UNDERLINE,
  CURSOR_BAR,
  CURSOR_RESET,
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

describe('cursor style (DECSCUSR)', () => {
  it('constants are correct escape sequences', () => {
    expect(CURSOR_BLOCK).toBe('\x1b[2 q');
    expect(CURSOR_UNDERLINE).toBe('\x1b[4 q');
    expect(CURSOR_BAR).toBe('\x1b[6 q');
    expect(CURSOR_RESET).toBe('\x1b[0 q');
  });

  it('setCursorStyle block writes steady block', () => {
    const io = mockIO();
    setCursorStyle(io, 'block');
    expect(io.written).toEqual(['\x1b[2 q']);
  });

  it('setCursorStyle block with blink writes blinking block', () => {
    const io = mockIO();
    setCursorStyle(io, 'block', { blink: true });
    expect(io.written).toEqual(['\x1b[1 q']);
  });

  it('setCursorStyle underline writes steady underline', () => {
    const io = mockIO();
    setCursorStyle(io, 'underline');
    expect(io.written).toEqual(['\x1b[4 q']);
  });

  it('setCursorStyle underline with blink writes blinking underline', () => {
    const io = mockIO();
    setCursorStyle(io, 'underline', { blink: true });
    expect(io.written).toEqual(['\x1b[3 q']);
  });

  it('setCursorStyle bar writes steady bar', () => {
    const io = mockIO();
    setCursorStyle(io, 'bar');
    expect(io.written).toEqual(['\x1b[6 q']);
  });

  it('setCursorStyle bar with blink writes blinking bar', () => {
    const io = mockIO();
    setCursorStyle(io, 'bar', { blink: true });
    expect(io.written).toEqual(['\x1b[5 q']);
  });

  it('resetCursorStyle writes reset sequence', () => {
    const io = mockIO();
    resetCursorStyle(io);
    expect(io.written).toEqual(['\x1b[0 q']);
  });
});
