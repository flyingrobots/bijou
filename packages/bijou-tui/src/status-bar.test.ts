import { describe, it, expect } from 'vitest';
import { statusBar } from './status-bar.js';
import { visibleLength } from './viewport.js';

describe('statusBar', () => {
  it('left only', () => {
    const result = statusBar({ left: 'hello', width: 10 });
    expect(result).toBe('hello     ');
    expect(visibleLength(result)).toBe(10);
  });

  it('center only', () => {
    const result = statusBar({ center: 'hi', width: 10 });
    expect(result).toBe('    hi    ');
    expect(visibleLength(result)).toBe(10);
  });

  it('right only', () => {
    const result = statusBar({ right: 'end', width: 10 });
    expect(result).toBe('       end');
    expect(visibleLength(result)).toBe(10);
  });

  it('all three sections with enough space', () => {
    const result = statusBar({ left: 'L', center: 'C', right: 'R', width: 20 });
    expect(visibleLength(result)).toBe(20);
    // Left at start, right at end, center centered
    expect(result[0]).toBe('L');
    expect(result[result.length - 1]).toBe('R');
    expect(result[9]).toBe('C');
  });

  it('fillChar works', () => {
    const result = statusBar({ left: 'A', right: 'B', width: 5, fillChar: '─' });
    expect(result).toBe('A───B');
  });

  it('left + right overlap truncates right', () => {
    const result = statusBar({ left: 'LONG', right: 'LONG', width: 6 });
    expect(visibleLength(result)).toBe(6);
    // Left is fully rendered (4 chars), right gets 2 chars
    expect(result.startsWith('LONG')).toBe(true);
  });

  it('left + center + right overlap truncates center first', () => {
    const result = statusBar({ left: 'LL', center: 'CCCCCC', right: 'RR', width: 8 });
    expect(visibleLength(result)).toBe(8);
    // Left and right should be intact
    expect(result.slice(0, 2)).toBe('LL');
    expect(result.slice(-2)).toBe('RR');
  });

  it('ANSI-styled sections preserve styles', () => {
    const styledLeft = '\x1b[31mhi\x1b[0m';
    const result = statusBar({ left: styledLeft, width: 10 });
    expect(result).toContain('\x1b[31m');
    expect(visibleLength(result)).toBe(10);
  });

  it('empty width returns empty string', () => {
    expect(statusBar({ left: 'x', width: 0 })).toBe('');
  });

  it('all sections empty produces fill string', () => {
    const result = statusBar({ width: 5 });
    expect(result).toBe('     ');
  });

  it('all sections empty with fillChar produces fill string', () => {
    const result = statusBar({ width: 5, fillChar: '-' });
    expect(result).toBe('-----');
  });

  it('single char width', () => {
    const result = statusBar({ left: 'ABC', width: 1 });
    expect(visibleLength(result)).toBe(1);
  });
});
