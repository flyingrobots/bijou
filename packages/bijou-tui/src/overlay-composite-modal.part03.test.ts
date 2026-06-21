import { describe, it, expect } from 'vitest';
import { must, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { modal } from './overlay.js';
import { clampCenteredPosition, resolveOverlayMargin } from './design-language.js';
import { visibleLength, stripAnsi } from './viewport.js';

describe('modal', () => {
  it('body-only modal renders bordered box', () => {
      const { content } = modal({ body: 'Hello', screenWidth: 40, screenHeight: 20 });
      const lines = content.split('\n');
      expect(must(lines[0])).toContain('\u250c'); // ┌
      expect(must(lines[lines.length - 1])).toContain('\u2514'); // └
      expect(stripAnsi(must(lines[1]))).toContain('Hello');
    });

  it('title renders bold above body with separator', () => {
      const { content } = modal({ title: 'Title', body: 'Body', screenWidth: 40, screenHeight: 20 });
      const lines = content.split('\n');
      // line 0: top border, line 1: title, line 2: blank separator, line 3: body, line 4: bottom
      expect(stripAnsi(must(lines[1]))).toContain('Title');
      // separator line is bordered but inner content is blank
      const sep = stripAnsi(must(lines[2])).replace(/[│]/g, '').trim();
      expect(sep).toBe('');
      expect(stripAnsi(must(lines[3]))).toContain('Body');
    });

  it('hint renders below body with separator', () => {
      const { content } = modal({ body: 'Body', hint: 'Press q', screenWidth: 40, screenHeight: 20 });
      const lines = content.split('\n');
      // line 0: top border, line 1: body, line 2: blank, line 3: hint, line 4: bottom
      expect(stripAnsi(must(lines[1]))).toContain('Body');
      const sep = stripAnsi(must(lines[2])).replace(/[│]/g, '').trim();
      expect(sep).toBe('');
      expect(stripAnsi(must(lines[3]))).toContain('Press q');
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
      expect(stripAnsi(must(lines[1]))).toContain('T');
      expect(stripAnsi(must(lines[3]))).toContain('B');
      expect(stripAnsi(must(lines[5]))).toContain('H');
    });

  it('centers on screen', () => {
      const { row, col, content } = modal({ body: 'Hi', screenWidth: 80, screenHeight: 24 });
      const boxLines = content.split('\n');
      const boxH = boxLines.length;
      const boxW = visibleLength(must(boxLines[0]));
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
      expect(visibleLength(must(lines[0]))).toBe(30);
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
      const boxWidth = visibleLength(must(result.content.split('\n')[0]));
      const margin = resolveOverlayMargin(20, 10);
      expect(boxWidth).toBe(6);
      expect(result.col).toBe(clampCenteredPosition(20, boxWidth, margin));
    });

  it('sizes ANSI wide glyph content by display width', () => {
      const result = modal({ body: '\x1b[31m漢\x1b[0m', screenWidth: 20, screenHeight: 10 });
      const boxWidth = visibleLength(must(result.content.split('\n')[0]));
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
});
