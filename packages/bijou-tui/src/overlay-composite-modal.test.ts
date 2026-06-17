import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { composite, compositeSurface, compositeSurfaceInto, modal, toast, drawer, tooltip } from './overlay.js';
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

  it('can composite in place without cloning the target surface', () => {
    const ctx = createTestContext();
    const bg = stringToSurface('AAAA', 4, 1);
    const ov: Overlay = {
      content: 'unused',
      surface: stringToSurface('XX', 2, 1),
      row: 0,
      col: 1,
    };

    const result = compositeSurfaceInto(bg, bg, [ov], { dim: true });

    expect(result).toBe(bg);
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

  it('sizes plain wide glyph content by display width', () => {
    const result = modal({ body: '漢', screenWidth: 20, screenHeight: 10 });
    const boxWidth = visibleLength(result.content.split('\n')[0]!);
    const margin = resolveOverlayMargin(20, 10);

    expect(boxWidth).toBe(6);
    expect(result.col).toBe(clampCenteredPosition(20, boxWidth, margin));
  });

  it('sizes ANSI wide glyph content by display width', () => {
    const result = modal({ body: '\x1b[31m漢\x1b[0m', screenWidth: 20, screenHeight: 10 });
    const boxWidth = visibleLength(result.content.split('\n')[0]!);
    const margin = resolveOverlayMargin(20, 10);

    expect(boxWidth).toBe(6);
    expect(result.col).toBe(clampCenteredPosition(20, boxWidth, margin));
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
