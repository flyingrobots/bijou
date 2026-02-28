import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { composite, modal, toast, drawer } from './overlay.js';
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
    // verify overlay portion between resets lacks dim code
    const overlayRegion = lines[0]!.split('\x1b[0m').find(s => s.includes('XX'));
    expect(overlayRegion).toBeDefined();
    expect(overlayRegion).not.toContain('\x1b[2m');
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

// ---------------------------------------------------------------------------
// drawer()
// ---------------------------------------------------------------------------

describe('drawer', () => {
  it('right-anchored drawer positions at col = screenWidth - width', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    expect(d.col).toBe(60);
  });

  it('left-anchored drawer positions at col = 0', () => {
    const d = drawer({ content: 'hi', anchor: 'left', width: 20, screenWidth: 80, screenHeight: 10 });
    expect(d.col).toBe(0);
  });

  it('default anchor is right', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    // Right-anchored: col should be screenWidth - width
    expect(d.col).toBe(80 - 20);
  });

  it('content fills exact screenHeight lines', () => {
    const d = drawer({ content: 'line1\nline2', width: 20, screenWidth: 80, screenHeight: 10 });
    const lines = d.content.split('\n');
    expect(lines).toHaveLength(10);
  });

  it('content gets clipped to inner width', () => {
    const longContent = 'A'.repeat(100);
    const d = drawer({ content: longContent, width: 20, screenWidth: 80, screenHeight: 5 });
    const lines = d.content.split('\n');
    // Each line should have visibleLength === width (20)
    for (const line of lines) {
      expect(visibleLength(line)).toBe(20);
    }
  });

  it('content shorter than available height gets padded with empty lines', () => {
    const d = drawer({ content: 'only one line', width: 20, screenWidth: 80, screenHeight: 10 });
    const lines = d.content.split('\n');
    expect(lines).toHaveLength(10);
    // Lines 2..8 (body lines after the first content line) should be padded with spaces inside borders
    const bodyLine = stripAnsi(lines[5]!);
    expect(bodyLine).toContain('\u2502');
    // Inner content should be spaces (trimmed)
    const inner = bodyLine.replace(/[│]/g, '').trim();
    expect(inner).toBe('');
  });

  it('content longer than available height gets truncated', () => {
    const manyLines = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
    const d = drawer({ content: manyLines, width: 20, screenWidth: 80, screenHeight: 10 });
    const lines = d.content.split('\n');
    expect(lines).toHaveLength(10);
    // Only first 8 content lines should appear (screenHeight 10 - 2 borders = 8)
    expect(stripAnsi(lines[1]!)).toContain('line 0');
    expect(stripAnsi(lines[8]!)).toContain('line 7');
  });

  it('title renders in top border', () => {
    const d = drawer({ content: 'hi', width: 30, screenWidth: 80, screenHeight: 10, title: 'Info' });
    const topLine = stripAnsi(d.content.split('\n')[0]!);
    expect(topLine).toContain('Info');
    expect(topLine).toContain('\u250c');
    expect(topLine).toContain('\u2510');
  });

  it('no title renders plain top border', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    const topLine = stripAnsi(d.content.split('\n')[0]!);
    expect(topLine).not.toContain(' ');
    expect(topLine).toContain('\u250c');
    expect(topLine).toContain('\u2510');
    // Should be all horizontal dashes between corners
    const inner = topLine.slice(1, -1);
    expect(inner).toBe('\u2500'.repeat(inner.length));
  });

  it('border characters are correct', () => {
    const d = drawer({ content: 'x', width: 10, screenWidth: 80, screenHeight: 5 });
    const lines = d.content.split('\n');
    const top = stripAnsi(lines[0]!);
    const bottom = stripAnsi(lines[lines.length - 1]!);
    const body = stripAnsi(lines[1]!);

    expect(top[0]).toBe('\u250c');                   // ┌
    expect(top[top.length - 1]).toBe('\u2510');       // ┐
    expect(top).toContain('\u2500');                  // ─
    expect(bottom[0]).toBe('\u2514');                 // └
    expect(bottom[bottom.length - 1]).toBe('\u2518'); // ┘
    expect(body[0]).toBe('\u2502');                   // │
    expect(body[body.length - 1]).toBe('\u2502');     // │
  });

  it('works without ctx (plain text borders)', () => {
    const d = drawer({ content: 'plain', width: 20, screenWidth: 80, screenHeight: 5 });
    expect(d.content).toContain('\u2502');
    expect(stripAnsi(d.content)).toContain('plain');
  });

  it('works with ctx (themed borders)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const d = drawer({
      content: 'themed',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      borderToken: ctx.theme.theme.border.primary,
      ctx,
    });
    expect(stripAnsi(d.content)).toContain('themed');
    expect(stripAnsi(d.content)).toContain('\u250c');
  });

  it('composites correctly with a background', () => {
    const bg = Array.from({ length: 10 }, () => '.'.repeat(80)).join('\n');
    const d = drawer({ content: 'panel', width: 20, screenWidth: 80, screenHeight: 10 });
    const result = composite(bg, [d]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(10);
    // Drawer top border should appear at row 0, col 60
    expect(stripAnsi(lines[0]!)).toContain('\u250c');
  });

  it('drawer width matches requested width (visibleLength of each line equals width)', () => {
    const d = drawer({ content: 'test\ndata', width: 25, screenWidth: 80, screenHeight: 8 });
    const lines = d.content.split('\n');
    for (const line of lines) {
      expect(visibleLength(line)).toBe(25);
    }
  });

  it('zero/small width edge case', () => {
    // Width 0 — innerWidth becomes 0 (max(0, 0-4))
    const d0 = drawer({ content: 'x', width: 0, screenWidth: 80, screenHeight: 3 });
    const lines0 = d0.content.split('\n');
    expect(lines0).toHaveLength(3);

    // Width 4 — innerWidth is exactly 0
    const d4 = drawer({ content: 'x', width: 4, screenWidth: 80, screenHeight: 3 });
    const lines4 = d4.content.split('\n');
    expect(lines4).toHaveLength(3);
    // Top border: ┌  ┐ (2 spaces for padding)
    expect(visibleLength(stripAnsi(lines4[0]!))).toBe(4);
  });
});
