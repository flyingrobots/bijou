import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { composite, modal, toast } from './overlay.js';
import type { Overlay } from './overlay.js';
import { visibleLength, stripAnsi } from './viewport.js';

// ---------------------------------------------------------------------------
// composite()
// ---------------------------------------------------------------------------

describe('composite', () => {
  it('paints single overlay at (0,0)', () => {
    const bg = 'AAAA\nBBBB\nCCCC';
    const ov: Overlay = { content: 'XX', row: 0, col: 0 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[0]!)).toBe('XXAA');
    expect(stripAnsi(lines[1]!)).toBe('BBBB');
  });

  it('paints single overlay at arbitrary offset', () => {
    const bg = 'AAAA\nBBBB\nCCCC';
    const ov: Overlay = { content: 'XX', row: 1, col: 2 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[0]!)).toBe('AAAA');
    expect(stripAnsi(lines[1]!)).toBe('BBXX');
    expect(stripAnsi(lines[2]!)).toBe('CCCC');
  });

  it('multi-line overlay replaces correct rows', () => {
    const bg = 'AAAA\nBBBB\nCCCC\nDDDD';
    const ov: Overlay = { content: 'XX\nYY', row: 1, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[1]!)).toBe('BXXB');
    expect(stripAnsi(lines[2]!)).toBe('CYYC');
  });

  it('multiple overlays, last wins on overlap', () => {
    const bg = 'AAAA\nBBBB';
    const ov1: Overlay = { content: 'XX', row: 0, col: 0 };
    const ov2: Overlay = { content: 'YY', row: 0, col: 0 };
    const result = composite(bg, [ov1, ov2]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[0]!)).toBe('YYAA');
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
    expect(stripAnsi(lines[1]!)).toBe('XXBB');
  });

  it('overlay beyond right edge extends the line', () => {
    const bg = 'AA\nBB';
    const ov: Overlay = { content: 'XXXX', row: 0, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[0]!)).toBe('AXXXX');
  });

  it('short background lines padded with spaces to reach col', () => {
    const bg = 'AB\nCD';
    const ov: Overlay = { content: 'X', row: 0, col: 5 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    expect(stripAnsi(lines[0]!)).toBe('AB   X');
  });

  it('dim wraps background lines', () => {
    const bg = 'AAAA\nBBBB';
    const ov: Overlay = { content: 'XX', row: 0, col: 1 };
    const result = composite(bg, [ov], { dim: true });
    const lines = result.split('\n');
    // background line 1 (row 1) should be dimmed
    expect(lines[1]!).toContain('\x1b[2m');
    // overlay content should NOT be dimmed
    expect(stripAnsi(lines[0]!)).toBe('AXXA');
  });

  it('styled background: non-overlaid regions preserve ANSI', () => {
    const bg = '\x1b[31mAAAA\x1b[0m\nBBBB';
    const ov: Overlay = { content: 'X', row: 0, col: 2 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    // Left portion should still contain red escape
    expect(lines[0]!).toContain('\x1b[31m');
    expect(stripAnsi(lines[0]!)).toBe('AAXA');
  });

  it('styled overlay on styled background: no cross-bleed', () => {
    const bg = '\x1b[31mAAAA\x1b[0m\n\x1b[32mBBBB\x1b[0m';
    const ov: Overlay = { content: '\x1b[34mXX\x1b[0m', row: 0, col: 1 };
    const result = composite(bg, [ov]);
    const lines = result.split('\n');
    // Resets should separate regions
    expect(lines[0]!).toContain('\x1b[0m');
    expect(stripAnsi(lines[0]!)).toBe('AXXA');
    // Second line untouched
    expect(stripAnsi(lines[1]!)).toBe('BBBB');
  });
});

// ---------------------------------------------------------------------------
// modal()
// ---------------------------------------------------------------------------

describe('modal', () => {
  it('body-only modal renders bordered box', () => {
    const { content } = modal({ body: 'Hello', screenWidth: 40, screenHeight: 20 });
    const lines = content.split('\n');
    expect(lines[0]!).toContain('\u250c'); // ┌
    expect(lines[lines.length - 1]!).toContain('\u2514'); // └
    expect(stripAnsi(lines[1]!)).toContain('Hello');
  });

  it('title renders bold above body with separator', () => {
    const { content } = modal({ title: 'Title', body: 'Body', screenWidth: 40, screenHeight: 20 });
    const lines = content.split('\n');
    // line 0: top border, line 1: title, line 2: blank separator, line 3: body, line 4: bottom
    expect(stripAnsi(lines[1]!)).toContain('Title');
    // separator line is bordered but inner content is blank
    const sep = stripAnsi(lines[2]!).replace(/[│]/g, '').trim();
    expect(sep).toBe('');
    expect(stripAnsi(lines[3]!)).toContain('Body');
  });

  it('hint renders below body with separator', () => {
    const { content } = modal({ body: 'Body', hint: 'Press q', screenWidth: 40, screenHeight: 20 });
    const lines = content.split('\n');
    // line 0: top border, line 1: body, line 2: blank, line 3: hint, line 4: bottom
    expect(stripAnsi(lines[1]!)).toContain('Body');
    const sep = stripAnsi(lines[2]!).replace(/[│]/g, '').trim();
    expect(sep).toBe('');
    expect(stripAnsi(lines[3]!)).toContain('Press q');
  });

  it('all three (title + body + hint) together', () => {
    const { content } = modal({
      title: 'T',
      body: 'B',
      hint: 'H',
      screenWidth: 40,
      screenHeight: 20,
    });
    const lines = content.split('\n');
    expect(stripAnsi(lines[1]!)).toContain('T');
    expect(stripAnsi(lines[3]!)).toContain('B');
    expect(stripAnsi(lines[5]!)).toContain('H');
  });

  it('centers on screen', () => {
    const { row, col, content } = modal({ body: 'Hi', screenWidth: 80, screenHeight: 24 });
    const boxLines = content.split('\n');
    const boxH = boxLines.length;
    const boxW = visibleLength(boxLines[0]!);
    expect(row).toBe(Math.floor((24 - boxH) / 2));
    expect(col).toBe(Math.floor((80 - boxW) / 2));
  });

  it('clamps to (0,0) when modal exceeds screen', () => {
    const { row, col } = modal({
      body: 'A very long line of text that is wider than the screen for sure!!!!',
      screenWidth: 5,
      screenHeight: 2,
    });
    expect(row).toBe(0);
    expect(col).toBe(0);
  });

  it('width override respected', () => {
    const { content } = modal({ body: 'Hi', screenWidth: 80, screenHeight: 24, width: 30 });
    const lines = content.split('\n');
    expect(visibleLength(lines[0]!)).toBe(30);
  });

  it('works without ctx (plain text, still has borders)', () => {
    const { content } = modal({ body: 'No ctx', screenWidth: 40, screenHeight: 20 });
    expect(content).toContain('\u2502');
    expect(stripAnsi(content)).toContain('No ctx');
  });

  it('works with ctx (themed)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const { content } = modal({
      body: 'Themed',
      title: 'Title',
      hint: 'hint',
      screenWidth: 40,
      screenHeight: 20,
      borderToken: ctx.theme.theme.border.primary,
      ctx,
    });
    expect(stripAnsi(content)).toContain('Themed');
    expect(stripAnsi(content)).toContain('Title');
    expect(stripAnsi(content)).toContain('hint');
  });
});

// ---------------------------------------------------------------------------
// toast()
// ---------------------------------------------------------------------------

describe('toast', () => {
  it('success variant has ✔ icon', () => {
    const { content } = toast({ message: 'ok', variant: 'success', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(content)).toContain('\u2714');
  });

  it('error variant has ✘ icon', () => {
    const { content } = toast({ message: 'fail', variant: 'error', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(content)).toContain('\u2718');
  });

  it('info variant has ℹ icon', () => {
    const { content } = toast({ message: 'note', variant: 'info', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(content)).toContain('\u2139');
  });

  it('default variant is info', () => {
    const { content } = toast({ message: 'note', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(content)).toContain('\u2139');
  });

  it('four anchors produce correct row/col', () => {
    const base = { message: 'msg', screenWidth: 80, screenHeight: 24, margin: 1 };

    const tr = toast({ ...base, anchor: 'top-right' });
    const br = toast({ ...base, anchor: 'bottom-right' });
    const bl = toast({ ...base, anchor: 'bottom-left' });
    const tl = toast({ ...base, anchor: 'top-left' });

    const boxH = tr.content.split('\n').length;
    const boxW = visibleLength(tr.content.split('\n')[0]!);

    expect(tr.row).toBe(1);
    expect(tr.col).toBe(80 - boxW - 1);

    expect(br.row).toBe(24 - boxH - 1);
    expect(br.col).toBe(80 - boxW - 1);

    expect(bl.row).toBe(24 - boxH - 1);
    expect(bl.col).toBe(1);

    expect(tl.row).toBe(1);
    expect(tl.col).toBe(1);
  });

  it('default anchor is bottom-right', () => {
    const { row, col, content } = toast({ message: 'x', screenWidth: 80, screenHeight: 24 });
    const boxH = content.split('\n').length;
    const boxW = visibleLength(content.split('\n')[0]!);
    expect(row).toBe(24 - boxH - 1);
    expect(col).toBe(80 - boxW - 1);
  });

  it('margin is respected', () => {
    const m3 = toast({ message: 'x', anchor: 'top-left', screenWidth: 80, screenHeight: 24, margin: 3 });
    expect(m3.row).toBe(3);
    expect(m3.col).toBe(3);
  });

  it('works without ctx', () => {
    const { content } = toast({ message: 'plain', screenWidth: 80, screenHeight: 24 });
    expect(content).toContain('\u2502');
    expect(stripAnsi(content)).toContain('plain');
  });

  it('works with ctx (themed)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const { content } = toast({ message: 'themed', variant: 'success', screenWidth: 80, screenHeight: 24, ctx });
    expect(stripAnsi(content)).toContain('\u2714');
    expect(stripAnsi(content)).toContain('themed');
  });

  it('composites correctly with a background', () => {
    const bg = Array.from({ length: 24 }, () => '.'.repeat(80)).join('\n');
    const t = toast({ message: 'saved', variant: 'success', screenWidth: 80, screenHeight: 24 });
    const result = composite(bg, [t]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(24);
    // Toast should appear near bottom-right
    expect(stripAnsi(lines[t.row]!)).toContain('\u250c');
  });
});
