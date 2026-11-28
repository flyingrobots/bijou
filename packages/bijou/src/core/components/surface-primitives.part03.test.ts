import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { boxSurface } from './box-v3.js';
import { separatorSurface } from './separator-v3.js';
import { createTextSurface } from './surface-text.js';
import { tableSurface } from './table-v3.js';

describe('surface-first primitives', () => {
  it('tableSurface normalizes fractional explicit column widths before layout math', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = tableSurface({
        columns: [
          { header: 'Key', width: 3.9 },
          { header: 'Val', width: 3.2 },
        ],
        rows: [
          ['LONG', 'ok'],
        ],
        ctx,
      });

      expect(Object.keys(surface.cells).some((key) => key.includes('.'))).toBe(false);
      expect(surface.get(6, 3).char).toBe('│');
      expect(surface.get(8, 3).char).toBe('o');
      expect(surface.get(9, 3).char).toBe('k');
    });

  it('tableSurface infers fallback columns from row data when columns are omitted', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = stripAnsi(surfaceToString(tableSurface({
        columns: [],
        rows: [['Alice', '95']],
        ctx,
      }), ctx.style));

      expect(rendered).toContain('Alice');
      expect(rendered).toContain('95');
      expect(rendered).toContain('┌');
    });

  it('createTextSurface accepts wide graphemes as two cells (flyingrobots/bijou#859)', () => {
      expect(createTextSurface('漢').width).toBe(2);
    });

  it('createTextSurface accepts rgb-only styles without hex strings', () => {
      const surface = createTextSurface('OK', {
        fgRGB: [12, 34, 56],
        bgRGB: [65, 43, 21],
        modifiers: ['bold'],
      });

      expect(surface.get(0, 0)).toEqual({
        char: 'O',
        fg: '#0c2238',
        bg: '#412b15',
        fgRGB: [12, 34, 56],
        bgRGB: [65, 43, 21],
        modifiers: ['bold'],
        empty: false,
        opacity: 1,
      });
    });

  it('createTextSurface strips destructive terminal escapes before writing cells', () => {
      const surface = createTextSurface('A\x1b[2JB\u0007');

      expect(surface.width).toBe(2);
      expect(surface.get(0, 0).char).toBe('A');
      expect(surface.get(1, 0).char).toBe('B');
    });

  it('separatorSurface accepts wide labels (flyingrobots/bijou#859)', () => {
      const ctx = createTestContext({ mode: 'interactive' });

      expect(stripAnsi(surfaceToString(separatorSurface({ label: '漢', width: 8, ctx }), ctx.style))).toContain(' 漢 ');
    });

  it('separatorSurface sanitizes destructive control sequences in labels', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = surfaceToString(separatorSurface({ label: 'Te\x1b[2Jst', width: 12, ctx }), ctx.style);

      expect(rendered).not.toContain('\x1b[2J');
      expect(stripAnsi(rendered)).toContain(' Test ');
    });

  it('boxSurface accepts wide text (flyingrobots/bijou#859)', () => {
      const ctx = createTestContext({ mode: 'interactive' });

      expect(stripAnsi(surfaceToString(boxSurface('漢', { ctx }), ctx.style))).toContain('漢');
    });

  it('boxSurface sanitizes destructive control sequences in titles', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = surfaceToString(boxSurface('Hi', { title: 'Ti\x1b[2Jtle', width: 12, ctx }), ctx.style);

      expect(rendered).not.toContain('\x1b[2J');
      expect(stripAnsi(rendered)).toContain('Title');
    });
});
