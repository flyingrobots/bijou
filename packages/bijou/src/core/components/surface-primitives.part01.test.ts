import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { stripAnsi } from '../text/grapheme.js';
import { surfaceToString } from '../render/differ.js';
import { alertSurface } from './alert-v3.js';
import { badge } from './badge.js';
import { boxSurface, headerBoxSurface } from './box-v3.js';
import { separatorSurface } from './separator-v3.js';

describe('surface-first primitives', () => {
  it('boxSurface renders bordered content with titles', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const rendered = stripAnsi(surfaceToString(boxSurface('Hello', { title: 'Card', width: 14, ctx }), ctx.style));

      expect(rendered).toContain('Hello');
      expect(rendered).toContain('Card');
      expect(rendered).toContain('┌');
      expect(rendered).toContain('┘');
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
      expect(rendered).toContain('\u2713');
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

  it('boxSurface preserves background metadata in noColor contexts', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
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

      expect(surface.get(1, 1).bg).toBe(ctx.surface('elevated').bg);
      expect(surface.get(3, 1).bg).toBe(ctx.surface('elevated').bg);
    });

  it('alertSurface preserves elevated background metadata in noColor contexts', () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true });
      const surface = alertSurface('Watch this space', { ctx });

      expect(surface.get(1, 1).bg).toBe(ctx.surface('elevated').bg);
      expect(surface.get(3, 1).bg).toBe(ctx.surface('elevated').bg);
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
      const surface = boxSurface('ABCDE', { width: 6, overflow: 'truncate', ctx });

      expect(surface.get(1, 1).char).toBe('A');
      expect(surface.get(4, 1).char).toBe('D');
      expect(surface.get(5, 1).char).toBe('│');
    });

  it('boxSurface wraps constrained string content by default', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const surface = boxSurface('ABCDEFGHI', { width: 7, ctx });

      expect(surface.height).toBeGreaterThan(3);
      expect(surface.get(1, 1).char).toBe('A');
      expect(surface.get(5, 1).char).toBe('E');
      expect(surface.get(1, 2).char).toBe('F');
    });
});
