import { describe, it, expect, vi } from 'vitest';
import { createSurface } from '../../ports/surface.js';
import { renderDiff, isSameCell } from './differ.js';
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
    expect(output).toContain('[STYLE:#ff0000]b');
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
});
