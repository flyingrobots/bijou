import { describe, it, expect, vi } from 'vitest';
import { createSurface } from '../../ports/surface.js';
import { renderDiff } from './differ.js';
import type { WritePort, StylePort } from '../../ports/index.js';

const CUP_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[\\d+;\\d+H`, 'g');

const noopWriteError = vi.fn();

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
    const write = vi.fn();
    const mockIo: WritePort = { write, writeError: vi.fn() };

    renderDiff(current, target, mockIo, mockStyle);
    expect(write).not.toHaveBeenCalled();
  });

  it('writes only changed cells with CUP move', () => {
    const current = createSurface(10, 10, { char: 'a' });
    const target = createSurface(10, 10, { char: 'a' });
    target.set(2, 2, { char: 'b', fg: '#ff0000' });
    
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: noopWriteError };

    renderDiff(current, target, mockIo, mockStyle);
    
    expect(output).toContain('\x1b[3;3H');
    expect(output).toContain('\x1b[38;2;255;0;0m');
    expect(output).toContain('b');
  });

  it('skips CUP move for contiguous horizontal changes', () => {
    const current = createSurface(10, 10, { char: ' ' });
    const target = createSurface(10, 10, { char: ' ' });
    target.set(0, 0, { char: 'A' });
    target.set(1, 0, { char: 'B' });
    
    let output = '';
    const mockIo: WritePort = { write: (s) => output += s, writeError: noopWriteError };

    renderDiff(current, target, mockIo, mockStyle);
    
    const cupMatches = output.match(CUP_PATTERN);
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
    const mockIo: WritePort = { write: (s) => output += s, writeError: noopWriteError };

    renderDiff(current, target, mockIo, mockStyle);
    
    const cupMatches = output.match(CUP_PATTERN);
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
    const mockIo: WritePort = { write: (s) => output += s, writeError: noopWriteError };
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
