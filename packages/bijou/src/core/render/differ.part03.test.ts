import { describe, it, expect } from 'vitest';
import { parseAnsiToSurface, stringToSurface } from './differ.js';

describe('surface text bridges', () => {
  it('stringToSurface preserves double-width graphemes as two columns', () => {
    const surface = stringToSurface('漢', 2, 1);

    expect(surface.get(0, 0).char).toBe('漢');
    expect(surface.get(1, 0).char).toBe('');
  });

  it('parseAnsiToSurface preserves double-width graphemes as two columns', () => {
    const surface = parseAnsiToSurface('\x1b[38;2;255;0;0m漢\x1b[0m', 2, 1);

    expect(surface.get(0, 0).char).toBe('漢');
    expect(surface.get(0, 0).fg).toBe('#ff0000');
    expect(surface.get(1, 0).char).toBe('');
    expect(surface.get(1, 0).fg).toBe('#ff0000');
  });

  it('parseAnsiToSurface ignores OSC 8 hyperlink control sequences while preserving visible text', () => {
    const surface = parseAnsiToSurface(
      '\x1b]8;;https://example.com\x1b\\bijou\x1b]8;;\x1b\\',
      8,
      1,
    );

    expect(surface.get(0, 0).char).toBe('b');
    expect(surface.get(1, 0).char).toBe('i');
    expect(surface.get(2, 0).char).toBe('j');
    expect(surface.get(3, 0).char).toBe('o');
    expect(surface.get(4, 0).char).toBe('u');
    expect(surface.get(5, 0).char).toBe(' ');
  });

  it('stringToSurface drops destructive terminal escapes before building cells', () => {
    const surface = stringToSurface('A\x1b[2JB\bC', 3, 1);

    expect(surface.get(0, 0).char).toBe('A');
    expect(surface.get(1, 0).char).toBe('B');
    expect(surface.get(2, 0).char).toBe('C');
  });

  it('parseAnsiToSurface preserves SGR styling while stripping non-SGR terminal escapes', () => {
    const surface = parseAnsiToSurface('\x1b[38;2;255;0;0mA\x1b[0m\x1b[2JB', 2, 1);

    expect(surface.get(0, 0).char).toBe('A');
    expect(surface.get(0, 0).fg).toBe('#ff0000');
    expect(surface.get(1, 0).char).toBe('B');
    expect(surface.get(1, 0).fg).toBeUndefined();
  });

  it('parseAnsiToSurface respects scoped SGR foreground and background resets', () => {
    const surface = parseAnsiToSurface(
      '\x1b[38;2;255;0;0m•\x1b[39m label\n\x1b[48;2;0;0;255mX\x1b[49mY',
      8,
      2,
    );

    expect(surface.get(0, 0).char).toBe('•');
    expect(surface.get(0, 0).fg).toBe('#ff0000');
    expect(surface.get(1, 0).char).toBe(' ');
    expect(surface.get(1, 0).fg).toBeUndefined();
    expect(surface.get(2, 0).char).toBe('l');
    expect(surface.get(2, 0).fg).toBeUndefined();

    expect(surface.get(0, 1).char).toBe('X');
    expect(surface.get(0, 1).bg).toBe('#0000ff');
    expect(surface.get(1, 1).char).toBe('Y');
    expect(surface.get(1, 1).bg).toBeUndefined();
  });
});
