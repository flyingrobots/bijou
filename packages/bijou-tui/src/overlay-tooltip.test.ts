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
