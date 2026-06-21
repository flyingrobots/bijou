import { describe, it, expect } from 'vitest';
import { auditStyle, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createSurface, stringToSurface } from '@flyingrobots/bijou';
import { createFocusAreaStateForSurface, focusAreaSurface, focusAreaSurfaceInto, focusAreaScrollTo, focusAreaScrollToX } from './focus-area.js';

describe('focusAreaSurface', () => {
  it('renders a scrolled surface with gutter and scrollbar', () => {
    const content = stringToSurface('abcdef\nghijkl\nmnopqr', 6, 3);
    let state = createFocusAreaStateForSurface(content, {
      width: 5,
      height: 2,
      overflowX: 'scroll',
    });
    state = focusAreaScrollTo(focusAreaScrollToX(state, 2), 1);

    const output = focusAreaSurface(content, state);

    expect(output.width).toBe(5);
    expect(output.height).toBe(2);
    expect(output.get(0, 0).char).toBe('▎');
    expect(output.get(1, 0).char).toBe('i');
    expect(output.get(2, 0).char).toBe('j');
    expect(output.get(3, 0).char).toBe('k');
    expect(output.get(4, 0).char).toMatch(/[█│]/);
  });

  it('omits the gutter in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const content = stringToSurface('abcdef\nghijkl', 6, 2);
    const state = createFocusAreaStateForSurface(content, {
      width: 4,
      height: 2,
      overflowX: 'hidden',
    });

    const output = focusAreaSurface(content, state, { ctx });

    expect(output.get(0, 0).char).toBe('a');
    expect(output.get(1, 0).char).toBe('b');
  });

  it('can paint into an existing target surface at an offset', () => {
    const content = stringToSurface('abcdef\nghijkl\nmnopqr', 6, 3);
    let state = createFocusAreaStateForSurface(content, {
      width: 5,
      height: 2,
      overflowX: 'scroll',
    });
    state = focusAreaScrollTo(focusAreaScrollToX(state, 2), 1);
    const target = createSurface(8, 4, { char: '.', empty: false });

    const output = focusAreaSurfaceInto(content, state, target, undefined, 2, 1);

    expect(output).toBe(target);
    expect(output.get(2, 1).char).toBe('▎');
    expect(output.get(3, 1).char).toBe('i');
    expect(output.get(4, 1).char).toBe('j');
    expect(output.get(5, 1).char).toBe('k');
    expect(output.get(6, 1).char).toMatch(/[█│]/);
    expect(output.get(1, 1).char).toBe('.');
  });

  it('exposes BCSS-targetable track and thumb cells for the scrollbar rail', () => {
    const style = auditStyle();
    const ctx = createTestContext({ style });
    ctx.resolveBCSS = (identity): Record<string, string> => {
      if (identity.type === 'FocusAreaScrollbarThumb' && identity.id === 'main') {
        return { color: '#ff00ff', background: '#101010' };
      }
      if (identity.type === 'FocusAreaScrollbarTrack' && identity.id === 'main') {
        return { color: '#00ffff' };
      }
      return {};
    };

    const content = stringToSurface('abcde\nfghij\nklmno\npqrst', 5, 4);
    const state = createFocusAreaStateForSurface(content, {
      width: 6,
      height: 2,
      overflowX: 'hidden',
      scrollbarMode: 'overlay',
    });

    const output = focusAreaSurface(content, state, { ctx, id: 'main' });
    expect(output.get(5, 0).char).toBe('█');
    expect(output.get(5, 1).char).toBe('│');

    const thumbCall = style.calls.find((call) => call.method === 'styled' && call.text === '█');
    const trackCall = style.calls.find((call) => call.method === 'styled' && call.text === '│');
    expect(thumbCall?.token).toMatchObject({ hex: '#ff00ff', bg: '#101010' });
    expect(trackCall?.token).toMatchObject({ hex: '#00ffff' });
  });

  it('defaults scrollbar cells to scrollbar UI tokens', () => {
    const style = auditStyle();
    const ctx = createTestContext({ style });
    ctx.tokenGraph.set('ui.scrollThumb', '#123456');
    ctx.tokenGraph.set('ui.scrollTrack', '#654321');
    ctx.tokenGraph.set('semantic.accent', '#abcdef');
    ctx.tokenGraph.set('semantic.muted', '#fedcba');

    const content = stringToSurface('abcde\nfghij\nklmno\npqrst', 5, 4);
    const state = createFocusAreaStateForSurface(content, {
      width: 6,
      height: 2,
      overflowX: 'hidden',
      scrollbarMode: 'overlay',
    });

    focusAreaSurface(content, state, { ctx, id: 'main' });

    const thumbCall = style.calls.find((call) => call.method === 'styled' && call.text === '█');
    const trackCall = style.calls.find((call) => call.method === 'styled' && call.text === '│');
    expect(thumbCall?.token).toMatchObject({ hex: '#123456' });
    expect(trackCall?.token).toMatchObject({ hex: '#654321' });
  });
});
