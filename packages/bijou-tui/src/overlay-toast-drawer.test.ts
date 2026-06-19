import { describe, it, expect } from 'vitest';
import { must, createTestContext  } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { composite, toast } from './overlay.js';
import { resolveOverlayMargin } from './design-language.js';
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
    const boxW = visibleLength(must(tr.content.split('\n')[0]));

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
    const boxW = visibleLength(must(content.split('\n')[0]));
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
    expect(stripAnsi(must(lines[t.row]))).toContain('\u250c');
  });

  it('provides a surface that matches its rendered content', () => {
    const ctx = createTestContext();
    const result = toast({ message: 'saved', variant: 'success', screenWidth: 80, screenHeight: 24, ctx });
    expect(result.surface).toBeDefined();
    expectSurfaceTextMatch(surfaceToString(must(result.surface), ctx.style), result.content);
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
    expect(must(result.surface).get(2, 1).fg).toBe(ctx.semantic('error').hex);
  });
});

// ---------------------------------------------------------------------------
// drawer()
// ---------------------------------------------------------------------------
