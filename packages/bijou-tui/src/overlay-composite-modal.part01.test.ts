import { describe, it, expect } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { composite } from './overlay.js';
import type { Overlay } from './overlay.js';
import { stripAnsi } from './viewport.js';

// ---------------------------------------------------------------------------
// composite()
// ---------------------------------------------------------------------------
describe('composite', () => {
  it('paints single overlay at (0,0)', () => {
    const bg = 'AAAA\nBBBB\nCCCC';
    const ov: Overlay = { content: 'XX', row: 0, col: 0 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[0]))).toBe('XXAA');
    expect(stripAnsi(must(lines[1]))).toBe('BBBB');
  });
  it('paints single overlay at arbitrary offset', () => {
    const bg = 'AAAA\nBBBB\nCCCC';
    const ov: Overlay = { content: 'XX', row: 1, col: 2 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[0]))).toBe('AAAA');
    expect(stripAnsi(must(lines[1]))).toBe('BBXX');
    expect(stripAnsi(must(lines[2]))).toBe('CCCC');
  });
  it('multi-line overlay replaces correct rows', () => {
    const bg = 'AAAA\nBBBB\nCCCC\nDDDD';
    const ov: Overlay = { content: 'XX\nYY', row: 1, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[1]))).toBe('BXXB');
    expect(stripAnsi(must(lines[2]))).toBe('CYYC');
  });
  it('multiple overlays, last wins on overlap', () => {
    const bg = 'AAAA\nBBBB';
    const ov1: Overlay = { content: 'XX', row: 0, col: 0 };
    const ov2: Overlay = { content: 'YY', row: 0, col: 0 };
    const result = composite(bg, [ov1, ov2]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[0]))).toBe('YYAA');
  });
  it('empty overlays returns background unchanged', () => {
    const bg = 'AAAA\nBBBB';
    const result = composite(bg, []);
    expect(stripAnsi(result)).toBe(bg);
  });
  it('overlay beyond bottom edge is clipped', () => {
    const bg = 'AAAA\nBBBB';
    const ov: Overlay = { content: 'XX\nYY\nZZ', row: 1, col: 0 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(stripAnsi(must(lines[1]))).toBe('XXBB');
  });
  it('overlay beyond right edge extends the line', () => {
    const bg = 'AA\nBB';
    const ov: Overlay = { content: 'XXXX', row: 0, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[0]))).toBe('AXXXX');
  });
  it('short background lines padded with spaces to reach col', () => {
    const bg = 'AB\nCD';
    const ov: Overlay = { content: 'X', row: 0, col: 5 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(must(lines[0]))).toBe('AB   X');
  });
  it('dim wraps background lines', () => {
    const bg = 'AAAA\nBBBB';
    const ov: Overlay = { content: 'XX', row: 0, col: 1 };
    const result = composite(bg, [ov], { dim: true });
    const lines = result.split('\n');
    // background line 1 (row 1) should be dimmed
    expect(must(lines[1])).toContain('\x1b[2m');
    // overlay content should NOT be dimmed
    expect(stripAnsi(must(lines[0]))).toBe('AXXA');
    // verify overlay portion between resets lacks dim code
    const overlayRegion = lines[0]?.split('\x1b[0m').find(s => s.includes('XX'));
    expect(overlayRegion).toBeDefined();
    expect(overlayRegion).not.toContain('\x1b[2m');
  });
  it('styled background: non-overlaid regions preserve ANSI', () => {
    const bg = '\x1b[31mAAAA\x1b[0m\nBBBB';
    const ov: Overlay = { content: 'X', row: 0, col: 2 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    // Left portion should still contain red escape
    expect(must(lines[0])).toContain('\x1b[31m');
    expect(stripAnsi(must(lines[0]))).toBe('AAXA');
  });
  it('styled overlay on styled background: no cross-bleed', () => {
    const bg = '\x1b[31mAAAA\x1b[0m\n\x1b[32mBBBB\x1b[0m';
    const ov: Overlay = { content: '\x1b[34mXX\x1b[0m', row: 0, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    // Resets should separate regions
    expect(must(lines[0])).toContain('\x1b[0m');
    expect(stripAnsi(must(lines[0]))).toBe('AXXA');
    // Second line untouched
    expect(stripAnsi(must(lines[1]))).toBe('BBBB');
  });
});
