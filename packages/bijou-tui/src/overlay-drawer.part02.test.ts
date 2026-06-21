import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { surfaceToString } from '@flyingrobots/bijou';
import { composite, drawer } from './overlay.js';
import { visibleLength, stripAnsi } from './viewport.js';

function expectSurfaceTextMatch(actualSurfaceText: string, expectedContent: string) {
  expect(
    stripAnsi(actualSurfaceText).split('\n').map((line) => line.trimEnd()),
  ).toEqual(
    stripAnsi(expectedContent).split('\n').map((line) => line.trimEnd()),
  );
}

describe('drawer', () => {
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
});
