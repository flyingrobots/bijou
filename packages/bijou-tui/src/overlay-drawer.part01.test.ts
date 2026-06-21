import { describe, it, expect } from 'vitest';
import { must } from '@flyingrobots/bijou/adapters/test';
import { drawer } from './overlay.js';
import { visibleLength, stripAnsi } from './viewport.js';

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
});
