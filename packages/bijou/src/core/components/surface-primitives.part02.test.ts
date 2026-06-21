import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { badge } from './badge.js';
import { boxSurface } from './box-v3.js';
import { createTextSurface } from './surface-text.js';
import { tableSurface } from './table-v3.js';

describe('surface-first primitives', () => {
  it('boxSurface normalizes fractional fixed widths before blitting content', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = boxSurface('ABCDE', { width: 3.9, ctx });

      expect(surface.width).toBe(3);
      expect(surface.get(1, 1).char).toBe('A');
      expect(surface.get(2, 1).char).toBe('│');
    });

  it('boxSurface clamps negative fixed widths to a minimal border shell', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = boxSurface('ABCDE', { width: -4, ctx });

      expect(surface.width).toBe(2);
      expect(surface.get(0, 0).char).toBe('┌');
      expect(surface.get(1, 0).char).toBe('┐');
      expect(surface.get(0, 1).char).toBe('│');
      expect(surface.get(1, 1).char).toBe('│');
    });

  it('tableSurface accepts Surface cells without explicit surfaceToString bridging', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = stripAnsi(surfaceToString(tableSurface({
        columns: [
          { header: 'Status' },
          { header: 'Score' },
        ],
        rows: [
          [badge('LIVE', { variant: 'success', ctx }), '95'],
        ],
        headerBgToken: { hex: '#ffffff', bg: '#001122' },
        ctx,
      }), ctx.style));

      expect(rendered).toContain('Status');
      expect(rendered).toContain('LIVE');
      expect(rendered).toContain('95');
      expect(rendered).toContain('┌');
    });

  it('tableSurface supports the common shorthand call shape', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = stripAnsi(surfaceToString(tableSurface(
        [
          { header: 'Status' },
          { header: 'Score' },
        ],
        [
          [badge('LIVE', { variant: 'success', ctx }), '95'],
        ],
        ctx,
      ), ctx.style));

      expect(rendered).toContain('Status');
      expect(rendered).toContain('LIVE');
      expect(rendered).toContain('95');
    });

  it('tableSurface paints the requested header background into the surface cells', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = tableSurface({
        columns: [{ header: 'Name' }],
        rows: [['Bijou']],
        headerBgToken: { hex: '#ffffff', bg: '#001122' },
        ctx,
      });

      expect(surface.get(1, 1).bg).toBe('#001122');
      expect(surface.get(2, 1).bg).toBe('#001122');
    });

  it('tableSurface preserves multiline Surface cells without duplicating them into later lines', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = tableSurface({
        columns: [
          { header: 'S', width: 4 },
          { header: 'N', width: 4 },
        ],
        rows: [
          [createTextSurface('UP\nDN'), 'ok'],
        ],
        ctx,
      });

      expect(surface.get(2, 3).char).toBe('U');
      expect(surface.get(3, 3).char).toBe('P');
      expect(surface.get(2, 4).char).toBe('D');
      expect(surface.get(3, 4).char).toBe('N');
      expect(surface.get(7, 3).char).toBe('│');
      expect(surface.get(7, 4).char).toBe('│');
      expect(surface.get(9, 3).char).toBe('o');
      expect(surface.get(9, 4).char).toBe(' ');
    });

  it('tableSurface clips wide Surface cells to the declared column width', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = tableSurface({
        columns: [
          { header: 'Key', width: 3 },
          { header: 'Val', width: 3 },
        ],
        rows: [
          [createTextSurface('LONGER'), 'ok'],
        ],
        overflow: 'truncate',
        ctx,
      });

      expect(surface.get(2, 3).char).toBe('L');
      expect(surface.get(3, 3).char).toBe('O');
      expect(surface.get(4, 3).char).toBe('N');
      expect(surface.get(6, 3).char).toBe('│');
      expect(surface.get(8, 3).char).toBe('o');
      expect(surface.get(9, 3).char).toBe('k');
    });

  it('tableSurface wraps explicit-width cells by default', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = tableSurface({
        columns: [
          { header: 'Key', width: 3 },
          { header: 'Val', width: 3 },
        ],
        rows: [
          [createTextSurface('LONGER'), 'ok'],
        ],
        ctx,
      });

      expect(surface.get(2, 3).char).toBe('L');
      expect(surface.get(3, 3).char).toBe('O');
      expect(surface.get(4, 3).char).toBe('N');
      expect(surface.get(2, 4).char).toBe('G');
      expect(surface.get(3, 4).char).toBe('E');
      expect(surface.get(4, 4).char).toBe('R');
    });
});
