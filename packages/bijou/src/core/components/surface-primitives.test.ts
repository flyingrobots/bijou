import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { alertSurface } from './alert-v3.js';
import { badge } from './badge.js';
import { boxSurface, boxV3, headerBoxSurface } from './box-v3.js';
import { separatorSurface } from './separator-v3.js';
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
});
