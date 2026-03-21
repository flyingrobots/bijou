import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { composite, compositeSurface, modal, toast, drawer, tooltip } from './overlay.js';
import type { Overlay, DrawerOptions } from './overlay.js';
import { clampCenteredPosition, resolveOverlayMargin } from './design-language.js';
import { visibleLength, stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

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

describe('compositeSurface', () => {
  it('paints overlay surfaces onto a background surface', () => {
    const bg = stringToSurface('AAAA\nBBBB\nCCCC', 4, 3);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX\nYY', 2, 2),
      row: 1,
      col: 1,
    };

    const result = compositeSurface(bg, [ov]);

    expect(surfaceToString(result, createTestContext().style)).toBe('AAAA\nBXXB\nCYYC');
  });

  it('dims background cells without dimming overlay cells', () => {
    const ctx = createTestContext();
    const bg = stringToSurface('AAAA', 4, 1);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX', 2, 1),
      row: 0,
      col: 1,
    };

    const result = compositeSurface(bg, [ov], { dim: true });

    expect(result.get(0, 0).modifiers).toContain('dim');
    expect(result.get(1, 0).modifiers ?? []).not.toContain('dim');
    expect(surfaceToString(result, ctx.style)).toBe('AXXA');
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
    const margin = resolveOverlayMargin(80, 24);
    expect(row).toBe(clampCenteredPosition(24, boxH, margin));
    expect(col).toBe(clampCenteredPosition(80, boxW, margin));
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
      borderToken: ctx.border('primary'),
      ctx,
    });
    expect(stripAnsi(content)).toContain('Themed');
    expect(stripAnsi(content)).toContain('Title');
    expect(stripAnsi(content)).toContain('hint');
  });

  it('bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const { content } = modal({
      body: 'Filled',
      screenWidth: 40,
      screenHeight: 20,
      bgToken: token,
      ctx,
    });
    expect(stripAnsi(content)).toContain('Filled');
    // borders still present
    expect(content).toContain('\u250c');
    expect(content).toContain('\u2514');
  });

  it('bgToken without bg field is a no-op', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const noBg = modal({
      body: 'NoBg',
      screenWidth: 40,
      screenHeight: 20,
      bgToken: { hex: '#ffffff' },
      ctx,
    });
    const plain = modal({ body: 'NoBg', screenWidth: 40, screenHeight: 20 });
    expect(stripAnsi(noBg.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken without ctx is ignored', () => {
    const plain = modal({ body: 'X', screenWidth: 40, screenHeight: 20 });
    const withToken = modal({
      body: 'X',
      screenWidth: 40,
      screenHeight: 20,
      bgToken: { hex: '#ffffff', bg: '#003366' },
    });
    expect(stripAnsi(withToken.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken with noColor is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const noColorResult = modal({
      body: 'NoBg',
      screenWidth: 40,
      screenHeight: 20,
      bgToken: { hex: '#ffffff', bg: '#003366' },
      ctx,
    });
    const plain = modal({ body: 'NoBg', screenWidth: 40, screenHeight: 20 });
    expect(stripAnsi(noColorResult.content)).toBe(stripAnsi(plain.content));
  });

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = modal({ title: 'Title', body: 'Body', hint: 'Hint', screenWidth: 40, screenHeight: 20, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('accepts structured surface body and hint content', () => {
    const ctx = createTestContext();
    const result = modal({
      title: 'Title',
      body: stringToSurface('line1\nline2', 5, 2),
      hint: stringToSurface('Press q', 7, 1),
      screenWidth: 40,
      screenHeight: 20,
      ctx,
    });
    expect(stripAnsi(result.content)).toContain('line1');
    expect(stripAnsi(result.content)).toContain('line2');
    expect(stripAnsi(result.content)).toContain('Press q');
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('keeps background fill on modal text cells in the returned surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = modal({
      body: 'Filled',
      screenWidth: 40,
      screenHeight: 20,
      bgToken: { hex: '#ffffff', bg: '#003366' },
      ctx,
    });
    expect(result.surface).toBeDefined();
    expect(result.surface!.get(2, 1).char).toBe('F');
    expect(result.surface!.get(2, 1).bg).toBe('#003366');
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
    const margin = resolveOverlayMargin(80, 24);
    expect(row).toBe(24 - boxH - margin);
    expect(col).toBe(80 - boxW - margin);
  });

  it('uses a preferred roomy margin by default and a compact margin on tight screens', () => {
    const roomy = toast({ message: 'roomy', screenWidth: 80, screenHeight: 24 });
    const compact = toast({ message: 'compact', screenWidth: 40, screenHeight: 12 });
    const roomyHeight = roomy.content.split('\n').length;
    const compactHeight = compact.content.split('\n').length;
    expect(roomy.row).toBe(24 - roomyHeight - 2);
    expect(compact.row).toBe(12 - compactHeight - 1);
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

  it('bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const { content } = toast({
      message: 'filled',
      screenWidth: 80,
      screenHeight: 24,
      bgToken: token,
      ctx,
    });
    expect(stripAnsi(content)).toContain('filled');
    expect(content).toContain('\u250c');
  });

  it('bgToken without bg field is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const noBg = toast({
      message: 'NoBg',
      screenWidth: 80,
      screenHeight: 24,
      bgToken: { hex: '#ffffff' },
      ctx,
    });
    const plain = toast({ message: 'NoBg', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(noBg.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken without ctx is ignored', () => {
    const plain = toast({ message: 'X', screenWidth: 80, screenHeight: 24 });
    const withToken = toast({
      message: 'X',
      screenWidth: 80,
      screenHeight: 24,
      bgToken: { hex: '#ffffff', bg: '#003366' },
    });
    expect(stripAnsi(withToken.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken with noColor is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const noColorResult = toast({
      message: 'NoBg',
      screenWidth: 80,
      screenHeight: 24,
      bgToken: { hex: '#ffffff', bg: '#003366' },
      ctx,
    });
    const plain = toast({ message: 'NoBg', screenWidth: 80, screenHeight: 24 });
    expect(stripAnsi(noColorResult.content)).toBe(stripAnsi(plain.content));
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

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = toast({ message: 'saved', variant: 'success', screenWidth: 80, screenHeight: 24, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('applies semantic styling directly to toast text cells', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = toast({
      message: 'Boom',
      variant: 'error',
      screenWidth: 80,
      screenHeight: 24,
      ctx,
    });
    expect(result.surface).toBeDefined();
    expect(result.surface!.get(2, 1).fg).toBe(ctx.semantic('error').hex);
  });
});

// ---------------------------------------------------------------------------
// drawer()
// ---------------------------------------------------------------------------

describe('drawer', () => {
  it('right-anchored drawer positions at col = screenWidth - width', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    expect(d.col).toBe(60);
    expect(d.row).toBe(0);
  });

  it('left-anchored drawer positions at col = 0', () => {
    const d = drawer({ content: 'hi', anchor: 'left', width: 20, screenWidth: 80, screenHeight: 10 });
    expect(d.col).toBe(0);
    expect(d.row).toBe(0);
  });

  it('top-anchored drawer positions at row = 0', () => {
    const d = drawer({ content: 'hi', anchor: 'top', height: 3, screenWidth: 80, screenHeight: 10 });
    expect(d.row).toBe(0);
    expect(d.col).toBe(0);
    expect(d.content.split('\n')).toHaveLength(3);
  });

  it('bottom-anchored drawer positions at row = screenHeight - height', () => {
    const d = drawer({ content: 'hi', anchor: 'bottom', height: 4, screenWidth: 80, screenHeight: 10 });
    expect(d.row).toBe(6);
    expect(d.col).toBe(0);
    expect(d.content.split('\n')).toHaveLength(4);
  });

  it('default anchor is right', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    // Right-anchored: col should be screenWidth - width
    expect(d.col).toBe(80 - 20);
  });

  it('throws when left/right anchor is missing width', () => {
    expect(() => drawer({
      content: 'x',
      anchor: 'left',
      screenWidth: 80,
      screenHeight: 10,
    } as unknown as DrawerOptions)).toThrow(/width/);
  });

  it('throws when top/bottom anchor is missing height', () => {
    expect(() => drawer({
      content: 'x',
      anchor: 'top',
      screenWidth: 80,
      screenHeight: 10,
    } as unknown as DrawerOptions)).toThrow(/height/);
  });

  it('content fills exact screenHeight lines', () => {
    const d = drawer({ content: 'line1\nline2', width: 20, screenWidth: 80, screenHeight: 10 });
    const lines = d.content.split('\n');
    expect(lines).toHaveLength(10);
  });

  it('can attach to a region (panel-scoped)', () => {
    const d = drawer({
      content: 'panel',
      anchor: 'right',
      width: 10,
      screenWidth: 80,
      screenHeight: 24,
      region: { row: 5, col: 20, width: 30, height: 8 },
    });

    expect(d.row).toBe(5);
    expect(d.col).toBe(40); // 20 + 30 - 10
    expect(d.content.split('\n')).toHaveLength(8);
  });

  it('region is clamped to screen bounds', () => {
    const d = drawer({
      content: 'clamp',
      anchor: 'bottom',
      height: 10,
      screenWidth: 40,
      screenHeight: 12,
      region: { row: 9, col: 30, width: 50, height: 50 },
    });

    // clamped region => row 9, col 30, width 10, height 3
    // bottom height 10 clamped to 3 -> row 9
    expect(d.row).toBe(9);
    expect(d.col).toBe(30);
    expect(d.content.split('\n')).toHaveLength(3);
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
      borderToken: ctx.border('primary'),
      ctx,
    });
    expect(stripAnsi(d.content)).toContain('themed');
    expect(stripAnsi(d.content)).toContain('\u250c');
  });

  it('bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const d = drawer({
      content: 'filled',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      bgToken: token,
      ctx,
    });
    expect(stripAnsi(d.content)).toContain('filled');
    expect(d.content).toContain('\u250c');
  });

  it('bgToken without bg field is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const noBg = drawer({
      content: 'NoBg',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      bgToken: { hex: '#ffffff' },
      ctx,
    });
    const plain = drawer({ content: 'NoBg', width: 20, screenWidth: 80, screenHeight: 5 });
    expect(stripAnsi(noBg.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken with noColor is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const noColorResult = drawer({
      content: 'NoBg',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      bgToken: { hex: '#ffffff', bg: '#003366' },
      ctx,
    });
    const plain = drawer({ content: 'NoBg', width: 20, screenWidth: 80, screenHeight: 5 });
    expect(stripAnsi(noColorResult.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken without ctx is ignored', () => {
    const plain = drawer({ content: 'X', width: 20, screenWidth: 80, screenHeight: 5 });
    const withToken = drawer({
      content: 'X',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      bgToken: { hex: '#ffffff', bg: '#003366' },
    });
    expect(stripAnsi(withToken.content)).toBe(stripAnsi(plain.content));
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

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = drawer({ content: 'panel', width: 20, screenWidth: 80, screenHeight: 5, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('accepts structured surface content', () => {
    const ctx = createTestContext();
    const result = drawer({
      content: stringToSurface('first\nsecond', 6, 2),
      width: 20,
      screenWidth: 80,
      screenHeight: 6,
      ctx,
    });
    expect(stripAnsi(result.content)).toContain('first');
    expect(stripAnsi(result.content)).toContain('second');
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('clips structured surface content to the drawer inner width', () => {
    const result = drawer({
      content: stringToSurface('ABCDEFG', 7, 1),
      width: 8,
      screenWidth: 80,
      screenHeight: 5,
    });
    expect(stripAnsi(result.content)).toContain('ABCD');
    expect(stripAnsi(result.content)).not.toContain('EFG');
  });

  it('keeps background fill on drawer text cells in the returned surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = drawer({
      content: 'panel',
      width: 20,
      screenWidth: 80,
      screenHeight: 5,
      bgToken: { hex: '#ffffff', bg: '#003366' },
      ctx,
    });
    expect(result.surface).toBeDefined();
    expect(result.surface!.get(2, 1).char).toBe('p');
    expect(result.surface!.get(2, 1).bg).toBe('#003366');
  });
});

// ---------------------------------------------------------------------------
// tooltip()
// ---------------------------------------------------------------------------

describe('tooltip', () => {
  const base = { content: 'hint', screenWidth: 80, screenHeight: 24 };

  it('top direction positions above target', () => {
    const t = tooltip({ ...base, row: 10, col: 40, direction: 'top' });
    const boxH = t.content.split('\n').length;
    expect(t.row).toBe(10 - boxH);
  });

  it('bottom direction positions below target', () => {
    const t = tooltip({ ...base, row: 10, col: 40, direction: 'bottom' });
    expect(t.row).toBe(11);
  });

  it('left direction positions to the left of target', () => {
    const t = tooltip({ ...base, row: 10, col: 40, direction: 'left' });
    const boxW = visibleLength(t.content.split('\n')[0]!);
    expect(t.col).toBe(40 - boxW);
  });

  it('right direction positions to the right of target', () => {
    const t = tooltip({ ...base, row: 10, col: 40, direction: 'right' });
    expect(t.col).toBe(41);
  });

  it('default direction is top', () => {
    const t = tooltip({ ...base, row: 10, col: 40 });
    const boxH = t.content.split('\n').length;
    expect(t.row).toBe(10 - boxH);
  });

  it('clamps to top edge', () => {
    const t = tooltip({ ...base, row: 0, col: 40, direction: 'top' });
    expect(t.row).toBe(0);
  });

  it('clamps to left edge', () => {
    const t = tooltip({ ...base, row: 10, col: 0, direction: 'left' });
    expect(t.col).toBe(0);
  });

  it('clamps to bottom edge', () => {
    const t = tooltip({ ...base, row: 23, col: 40, direction: 'bottom' });
    const boxH = t.content.split('\n').length;
    expect(t.row).toBeLessThanOrEqual(24 - boxH);
  });

  it('clamps to right edge', () => {
    const t = tooltip({ ...base, row: 10, col: 79, direction: 'right' });
    const boxW = visibleLength(t.content.split('\n')[0]!);
    expect(t.col).toBeLessThanOrEqual(80 - boxW);
  });

  it('renders bordered box', () => {
    const t = tooltip({ ...base, row: 10, col: 40 });
    const lines = t.content.split('\n');
    expect(stripAnsi(lines[0]!)).toContain('\u250c');
    expect(stripAnsi(lines[lines.length - 1]!)).toContain('\u2514');
    expect(stripAnsi(t.content)).toContain('hint');
  });

  it('works without ctx', () => {
    const t = tooltip({ ...base, row: 10, col: 40 });
    expect(t.content).toContain('\u2502');
    expect(stripAnsi(t.content)).toContain('hint');
  });

  it('works with ctx (themed)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const t = tooltip({
      ...base,
      row: 10,
      col: 40,
      borderToken: ctx.border('primary'),
      ctx,
    });
    expect(stripAnsi(t.content)).toContain('hint');
    expect(stripAnsi(t.content)).toContain('\u250c');
  });

  it('handles multi-line content', () => {
    const t = tooltip({ ...base, content: 'line1\nline2', row: 10, col: 40 });
    const lines = t.content.split('\n');
    // Box wraps 2 content lines: top border + line1 + line2 + bottom border = 4
    expect(lines).toHaveLength(4);
    expect(stripAnsi(t.content)).toContain('line1');
    expect(stripAnsi(t.content)).toContain('line2');
  });

  it('clamps oversized tooltip to tiny screen', () => {
    const t = tooltip({ content: 'wide content here', row: 0, col: 0, screenWidth: 5, screenHeight: 3, direction: 'bottom' });
    expect(t.row).toBeGreaterThanOrEqual(0);
    expect(t.col).toBeGreaterThanOrEqual(0);
  });

  it('bgToken does not crash with plainStyle ctx', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const token = { hex: '#ffffff', bg: '#003366' };
    const t = tooltip({ ...base, row: 10, col: 40, bgToken: token, ctx });
    expect(stripAnsi(t.content)).toContain('hint');
    expect(t.content).toContain('\u250c');
    expect(t.content).toContain('\u2514');
  });

  it('bgToken without bg field is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const noBg = tooltip({ ...base, row: 10, col: 40, bgToken: { hex: '#ffffff' }, ctx });
    const plain = tooltip({ ...base, row: 10, col: 40 });
    expect(stripAnsi(noBg.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken without ctx is ignored', () => {
    const plain = tooltip({ ...base, row: 10, col: 40 });
    const withToken = tooltip({ ...base, row: 10, col: 40, bgToken: { hex: '#ffffff', bg: '#003366' } });
    expect(stripAnsi(withToken.content)).toBe(stripAnsi(plain.content));
  });

  it('bgToken with noColor is no-op', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const noColorResult = tooltip({ ...base, row: 10, col: 40, bgToken: { hex: '#ffffff', bg: '#003366' }, ctx });
    const plain = tooltip({ ...base, row: 10, col: 40 });
    expect(stripAnsi(noColorResult.content)).toBe(stripAnsi(plain.content));
  });

  it('clips content to screen width', () => {
    const longContent = 'A'.repeat(100);
    const t = tooltip({ content: longContent, row: 10, col: 0, screenWidth: 20, screenHeight: 24 });
    const lines = t.content.split('\n');
    for (const line of lines) {
      // Each line should not exceed screenWidth
      expect(visibleLength(stripAnsi(line))).toBeLessThanOrEqual(20);
    }
  });

  it('composites with background', () => {
    const bg = Array.from({ length: 24 }, () => '.'.repeat(80)).join('\n');
    const t = tooltip({ ...base, row: 12, col: 40, direction: 'bottom' });
    const result = composite(bg, [t]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(24);
    expect(stripAnsi(lines[t.row]!)).toContain('\u250c');
  });

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = tooltip({ ...base, row: 10, col: 40, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('accepts structured surface content', () => {
    const ctx = createTestContext();
    const result = tooltip({
      content: stringToSurface('line1\nline2', 5, 2),
      row: 10,
      col: 40,
      screenWidth: 80,
      screenHeight: 24,
      ctx,
    });
    expect(stripAnsi(result.content)).toContain('line1');
    expect(stripAnsi(result.content)).toContain('line2');
    expectSurfaceTextMatch(surfaceToString(result.surface!, ctx.style), result.content);
  });

  it('clips structured surface content to screen width', () => {
    const result = tooltip({
      content: stringToSurface('ABCDEFG', 7, 1),
      row: 10,
      col: 0,
      screenWidth: 6,
      screenHeight: 24,
      direction: 'right',
    });
    for (const line of result.content.split('\n')) {
      expect(visibleLength(stripAnsi(line))).toBeLessThanOrEqual(6);
    }
    expect(stripAnsi(result.content)).toContain('AB');
    expect(stripAnsi(result.content)).not.toContain('CDEFG');
  });
});
