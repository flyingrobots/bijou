import { describe, it, expect } from 'vitest';
import { must, createTestContext  } from '@flyingrobots/bijou/adapters/test';
import { stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { composite, drawer } from './overlay.js';
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
    expect(() => {
      Reflect.apply(drawer, undefined, [{
        content: 'x',
        anchor: 'left',
        screenWidth: 80,
        screenHeight: 10,
      }]);
    }).toThrow(/width/);
  });

  it('throws when top/bottom anchor is missing height', () => {
    expect(() => {
      Reflect.apply(drawer, undefined, [{
        content: 'x',
        anchor: 'top',
        screenWidth: 80,
        screenHeight: 10,
      }]);
    }).toThrow(/height/);
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
    const bodyLine = stripAnsi(must(lines[5]));
    expect(bodyLine).toContain('\u2502');
    // Inner content should be spaces (trimmed)
    const inner = bodyLine.replace(/[│]/g, '').trim();
    expect(inner).toBe('');
  });

  it('content longer than available height gets truncated', () => {
    const manyLines = Array.from({ length: 50 }, (_, i) => `line ${String(i)}`).join('\n');
    const d = drawer({ content: manyLines, width: 20, screenWidth: 80, screenHeight: 10 });
    const lines = d.content.split('\n');
    expect(lines).toHaveLength(10);
    // Only first 8 content lines should appear (screenHeight 10 - 2 borders = 8)
    expect(stripAnsi(must(lines[1]))).toContain('line 0');
    expect(stripAnsi(must(lines[8]))).toContain('line 7');
  });

  it('title renders in top border', () => {
    const d = drawer({ content: 'hi', width: 30, screenWidth: 80, screenHeight: 10, title: 'Info' });
    const topLine = stripAnsi(must(d.content.split('\n')[0]));
    expect(topLine).toContain('Info');
    expect(topLine).toContain('\u250c');
    expect(topLine).toContain('\u2510');
  });

  it('no title renders plain top border', () => {
    const d = drawer({ content: 'hi', width: 20, screenWidth: 80, screenHeight: 10 });
    const topLine = stripAnsi(must(d.content.split('\n')[0]));
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
    const top = stripAnsi(must(lines[0]));
    const bottom = stripAnsi(must(lines[lines.length - 1]));
    const body = stripAnsi(must(lines[1]));

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
    expect(stripAnsi(must(lines[0]))).toContain('\u250c');
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
    expect(visibleLength(stripAnsi(must(lines4[0])))).toBe(4);
  });

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = drawer({ content: 'panel', width: 20, screenWidth: 80, screenHeight: 5, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
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
    expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
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
    expect(must(result.surface).get(2, 1).char).toBe('p');
    expect(must(result.surface).get(2, 1).bg).toBe('#003366');
  });
});

// ---------------------------------------------------------------------------
// tooltip()
// ---------------------------------------------------------------------------
