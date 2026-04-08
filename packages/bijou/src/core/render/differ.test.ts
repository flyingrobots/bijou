import { describe, it, expect, vi } from 'vitest';
import { createSurface } from '../../ports/surface.js';
import { parseAnsiToSurface, renderDiff, isSameCell, stringToSurface } from './differ.js';
import type { WritePort, StylePort } from '../../ports/index.js';

describe('isSameCell', () => {
  it('identifies identical cells', () => {
    const a = { char: 'x', fg: '#ff0000', bg: '#000000', modifiers: ['bold'] };
    const b = { char: 'x', fg: '#ff0000', bg: '#000000', modifiers: ['bold'] };
    expect(isSameCell(a, b)).toBe(true);
  });

  it('identifies character differences', () => {
    const a = { char: 'x' };
    const b = { char: 'y' };
    expect(isSameCell(a, b)).toBe(false);
  });

  it('identifies style differences', () => {
    const a = { char: 'x', fg: '#ff0000' };
    const b = { char: 'x', fg: '#00ff00' };
    expect(isSameCell(a, b)).toBe(false);
  });
});

describe('renderDiff', () => {
  const mockStyle: StylePort = {
    styled: (t, text) => `[STYLE:${t.hex}]${text}`,
    rgb: (r, g, b, text) => text,
    hex: (c, text) => text,
    bgRgb: (r, g, b, text) => text,
    bgHex: (c, text) => text,
    bold: (text) => text,
  };

  it('writes nothing if surfaces are identical', () => {
    const current = createSurface(10, 10, { char: 'a' });
    const target = createSurface(10, 10, { char: 'a' });
    const mockIo: WritePort = { write: vi.fn(), writeError: vi.fn() };

    renderDiff(current, target, mockIo, mockStyle);
    expect(mockIo.write).not.toHaveBeenCalled();
  });

  it('writes only changed cells with CUP move', () => {
    const current = createSurface(10, 10, { char: 'a' });
    const target = createSurface(10, 10, { char: 'a' });
    target.set(2, 2, { char: 'b', fg: '#ff0000' });
    
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: () => {} };

    renderDiff(current, target, mockIo, mockStyle);
    
    // Should move to (2,2) and write 'b'
    // 0-based (2,2) is 1-based (3,3) in ANSI
    expect(output).toContain('\x1b[3;3H');
    // Packed differ emits ANSI SGR directly, bypassing StylePort
    expect(output).toContain('\x1b[38;2;255;0;0m');
    expect(output).toContain('b');
  });

  it('skips CUP move for contiguous horizontal changes', () => {
    const current = createSurface(10, 10, { char: ' ' });
    const target = createSurface(10, 10, { char: ' ' });
    target.set(0, 0, { char: 'A' });
    target.set(1, 0, { char: 'B' });
    
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: () => {} };

    renderDiff(current, target, mockIo, mockStyle);
    
    // Only one CUP at start
    const cupMatches = output.match(/\x1b\[\d+;\d+H/g);
    expect(cupMatches?.length).toBe(1);
    expect(cupMatches?.[0]).toBe('\x1b[1;1H');
    expect(output).toContain('A');
    expect(output).toContain('B');
  });

  it('performs CUP move for non-contiguous changes', () => {
    const current = createSurface(10, 10, { char: ' ' });
    const target = createSurface(10, 10, { char: ' ' });
    target.set(0, 0, { char: 'A' });
    target.set(5, 0, { char: 'B' });
    
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: () => {} };

    renderDiff(current, target, mockIo, mockStyle);
    
    const cupMatches = output.match(/\x1b\[\d+;\d+H/g);
    expect(cupMatches?.length).toBe(2);
    expect(cupMatches?.[0]).toBe('\x1b[1;1H');
    expect(cupMatches?.[1]).toBe('\x1b[1;6H');
  });

  it('writes plain unstyled batches directly without style wrapping', () => {
    const current = createSurface(2, 1, { char: ' ' });
    const target = createSurface(2, 1, { char: ' ' });
    target.set(0, 0, { char: 'A', empty: false });
    target.set(1, 0, { char: 'B', empty: false });

    const styled = vi.fn((_token: unknown, text: string) => `[STYLE]${text}`);
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: () => {} };
    const style: StylePort = {
      styled,
      rgb: (_r, _g, _b, text) => text,
      hex: (_c, text) => text,
      bgRgb: (_r, _g, _b, text) => text,
      bgHex: (_c, text) => text,
      bold: (text) => text,
    };

    renderDiff(current, target, mockIo, style);

    expect(styled).not.toHaveBeenCalled();
    expect(output).toBe('\x1b[1;1HAB');
  });
});

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
});
