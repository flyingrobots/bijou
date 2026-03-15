import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { alertSurface } from './alert-v3.js';
import { badge } from './badge.js';
import { boxSurface, boxV3, headerBoxSurface } from './box-v3.js';
import { separatorSurface } from './separator-v3.js';
import { createTextSurface } from './surface-text.js';
import { tableSurface } from './table-v3.js';

describe('surface-first primitives', () => {
  it('boxSurface preserves the existing boxV3 behavior', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const next = stripAnsi(surfaceToString(boxSurface('Hello', { title: 'Card', width: 14, ctx }), ctx.style));
    const legacy = stripAnsi(surfaceToString(boxV3('Hello', { title: 'Card', width: 14, ctx }), ctx.style));

    expect(next).toBe(legacy);
    expect(next).toContain('Hello');
    expect(next).toContain('Card');
  });

  it('headerBoxSurface returns a boxed surface with styled detail text', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = stripAnsi(surfaceToString(
      headerBoxSurface('Deploy', { detail: 'v3.1.0 preview', ctx }),
      ctx.style,
    ));

    expect(rendered).toContain('Deploy');
    expect(rendered).toContain('v3.1.0 preview');
    expect(rendered).toContain('┌');
  });

  it('boxSurface widens auto-width boxes to preserve long titles', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = stripAnsi(surfaceToString(
      boxSurface('Hi', { title: 'Long title', ctx }),
      ctx.style,
    ));

    expect(rendered).toContain('Long');
    expect(rendered).toContain('Hi');
    expect(rendered.split('\n')[0]).not.toBe('┌──┐');
  });

  it('separatorSurface returns a width-locked separator surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = stripAnsi(surfaceToString(separatorSurface({ label: 'Section', width: 24, ctx }), ctx.style));

    expect(rendered).toContain('Section');
    expect(rendered.length).toBe(24);
  });

  it('alertSurface accepts a nested Surface payload', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const rendered = stripAnsi(surfaceToString(
      alertSurface(badge('READY', { variant: 'success', ctx }), { variant: 'success', ctx }),
      ctx.style,
    ));

    expect(rendered).toContain('READY');
    expect(rendered).toContain('✓');
  });

  it('boxSurface paints the requested background token behind content cells', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = boxSurface('Hi', {
      bgToken: { hex: '#ffffff', bg: '#112233' },
      ctx,
    });

    expect(surface.get(1, 1).char).toBe('H');
    expect(surface.get(1, 1).bg).toBe('#112233');
    expect(surface.get(2, 1).char).toBe('i');
    expect(surface.get(2, 1).bg).toBe('#112233');
  });

  it('alertSurface carries the default elevated background into interior cells', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = alertSurface('Watch this space', { ctx });

    expect(surface.get(1, 1).bg).toBe(ctx.surface('elevated')?.bg);
    expect(surface.get(3, 1).bg).toBe(ctx.surface('elevated')?.bg);
  });

  it('alertSurface accepts a custom borderToken override', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = alertSurface('Watch this border', {
      borderToken: { hex: '#112233' },
      ctx,
    });

    expect(surface.get(0, 0).fg).toBe('#112233');
    expect(surface.get(surface.width - 1, surface.height - 1).fg).toBe('#112233');
  });

  it('boxSurface falls back to a safe fill character for wide graphemes', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = boxSurface('A', {
      padding: { left: 1, right: 1 },
      fillChar: '界',
      ctx,
    });

    expect(surface.get(1, 1).char).toBe(' ');
  });

  it('boxSurface clips constrained content and preserves the right border', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const surface = boxSurface('ABCDE', { width: 6, ctx });

    expect(surface.get(1, 1).char).toBe('A');
    expect(surface.get(4, 1).char).toBe('D');
    expect(surface.get(5, 1).char).toBe('│');
  });

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
        { header: 'State', width: 4 },
        { header: 'Next', width: 4 },
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
      ctx,
    });

    expect(surface.get(2, 3).char).toBe('L');
    expect(surface.get(3, 3).char).toBe('O');
    expect(surface.get(4, 3).char).toBe('N');
    expect(surface.get(6, 3).char).toBe('│');
    expect(surface.get(8, 3).char).toBe('o');
    expect(surface.get(9, 3).char).toBe('k');
  });

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

  it('createTextSurface rejects wide graphemes until surface wide-cell support exists', () => {
    expect(() => createTextSurface('漢')).toThrow(/does not yet support wide graphemes/);
  });

  it('separatorSurface rejects wide labels until surface wide-cell support exists', () => {
    const ctx = createTestContext({ mode: 'interactive' });

    expect(() => separatorSurface({ label: '漢', width: 8, ctx })).toThrow(/does not yet support wide graphemes/);
  });

  it('boxSurface rejects wide text until surface wide-cell support exists', () => {
    const ctx = createTestContext({ mode: 'interactive' });

    expect(() => boxSurface('漢', { ctx })).toThrow(/does not yet support wide graphemes/);
  });
});
