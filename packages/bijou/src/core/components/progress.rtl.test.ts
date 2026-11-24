import { describe, it, expect } from 'vitest';
import { progressBar } from './progress.js';
import { createTestContext } from '../../adapters/test/index.js';
import { plainStyle } from '../../adapters/test/style.js';
import type { StylePort } from '../../ports/style.js';
import { graphemeWidth } from '../text/grapheme.part04.js';

/** Style that tags each styled run with its token hex so tests can read visual order. */
function taggingStyle(): StylePort {
  return {
    ...plainStyle(),
    styled: (token, text) => `[${token.hex}]${text}`,
  };
}

const TOKENS = {
  filledToken: { hex: '#00aaee' },
  filledEndToken: { hex: '#ff44aa' },
  emptyToken: { hex: '#112233' },
} as const;

describe('progressBar direction', () => {
  it('grows the fill from the right edge under rtl in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(progressBar(50, { width: 10, showPercent: false, direction: 'rtl', ctx }))
      .toBe('⠐⠐⠐⠐⠐█████');
  });

  it('grows the fill from the right edge under rtl in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    expect(progressBar(30, { width: 10, showPercent: false, direction: 'rtl', ctx }))
      .toBe('⠐⠐⠐⠐⠐⠐⠐███');
  });

  it('keeps the ltr fill growing from the left edge', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    expect(progressBar(50, { width: 10, showPercent: false, direction: 'ltr', ctx }))
      .toBe('█████⠐⠐⠐⠐⠐');
    expect(progressBar(50, { width: 10, ctx })).toBe(' 50% █████⠐⠐⠐⠐⠐');
  });

  it('puts the label on the start side, flush against the bar, under rtl', () => {
    const ctx = createTestContext({ mode: 'static' });
    expect(progressBar(50, { width: 10, direction: 'rtl', ctx })).toBe('⠐⠐⠐⠐⠐█████ 50% ');
    expect(progressBar(5, { width: 4, direction: 'rtl', ctx })).toBe('⠐⠐⠐⠐ 5%  ');
    expect(progressBar(100, { width: 4, direction: 'rtl', ctx })).toBe('████ 100%');
  });

  it('does not reverse the characters of the percentage label', () => {
    const ctx = createTestContext({ mode: 'static' });
    const out = progressBar(42, { width: 4, direction: 'rtl', ctx });
    expect(out).toContain('42%');
    expect(out).not.toContain('%24');
  });

  it('draws 0% and 100% identically in both directions apart from the label side', () => {
    const ctx = createTestContext({ mode: 'static' });
    for (const pct of [0, 100]) {
      const ltr = progressBar(pct, { width: 6, showPercent: false, direction: 'ltr', ctx });
      const rtl = progressBar(pct, { width: 6, showPercent: false, direction: 'rtl', ctx });
      expect(rtl).toBe(ltr);
    }
  });

  it('uses the same whole-cell fill count in both directions', () => {
    const ctx = createTestContext({ mode: 'static' });
    for (let pct = 0; pct <= 100; pct += 7) {
      const ltr = progressBar(pct, { width: 9, showPercent: false, direction: 'ltr', ctx });
      const rtl = progressBar(pct, { width: 9, showPercent: false, direction: 'rtl', ctx });
      expect(Array.from(rtl).reverse().join('')).toBe(ltr);
    }
  });

  it('reads ctx.direction and lets the explicit option override it', () => {
    const rtlCtx = createTestContext({ mode: 'static', direction: 'rtl' });
    const opts = { width: 4, showPercent: false } as const;
    expect(progressBar(50, { ...opts, ctx: rtlCtx })).toBe('⠐⠐██');
    expect(progressBar(50, { ...opts, direction: 'ltr', ctx: rtlCtx })).toBe('██⠐⠐');
  });

  it('keeps pipe output identical under rtl', () => {
    const ctx = createTestContext({ mode: 'pipe', direction: 'rtl' });
    expect(progressBar(45, { ctx })).toBe('Progress: 45%');
    expect(progressBar(45, { direction: 'rtl', ctx })).toBe('Progress: 45%');
  });

  it('keeps accessible output identical under rtl', () => {
    const ctx = createTestContext({ mode: 'accessible', direction: 'rtl' });
    expect(progressBar(45, { ctx })).toBe('45 percent complete.');
    expect(progressBar(45, { direction: 'rtl', ctx })).toBe('45 percent complete.');
  });
});

describe('progressBar direction: colour and glyphs', () => {
  it('puts the leading gradient edge at the right under rtl', () => {
    const ctx = createTestContext({ mode: 'static', style: taggingStyle() });
    const opts = { width: 4, showPercent: false, ...TOKENS, ctx } as const;
    expect(progressBar(50, { ...opts, direction: 'ltr' }))
      .toBe('[#00aaee]█[#ff44aa]█[#112233]⠐⠐');
    expect(progressBar(50, { ...opts, direction: 'rtl' }))
      .toBe('[#112233]⠐⠐[#ff44aa]█[#00aaee]█');
  });

  it('mirrors a caller-supplied directional fill glyph and leaves symmetric glyphs alone', () => {
    const ctx = createTestContext({ mode: 'static' });
    const arrows = { width: 4, showPercent: false, filled: '▶', empty: '·', ctx } as const;
    expect(progressBar(50, { ...arrows, direction: 'ltr' })).toBe('▶▶··');
    expect(progressBar(50, { ...arrows, direction: 'rtl' })).toBe('··◀◀');
    const ascii = { width: 4, showPercent: false, filled: '#', empty: '-', ctx } as const;
    expect(progressBar(50, { ...ascii, direction: 'rtl' })).toBe('--##');
  });

  it('keeps ASCII greater-than and less-than fills unmirrored', () => {
    const ctx = createTestContext({ mode: 'static' });
    const out = progressBar(50, { width: 4, showPercent: false, filled: '>', empty: '.', direction: 'rtl', ctx });
    expect(out).toBe('..>>');
  });

  it('keeps total width and combining marks intact with wide and combining cells', () => {
    const ctx = createTestContext({ mode: 'static' });
    const opts = { width: 6, showPercent: false, filled: '世', empty: 'é', ctx } as const;
    const ltr = progressBar(50, { ...opts, direction: 'ltr' });
    const rtl = progressBar(50, { ...opts, direction: 'rtl' });
    expect(ltr).toBe('世世世ééé');
    expect(rtl).toBe('ééé世世世');
    expect(graphemeWidth(rtl)).toBe(graphemeWidth(ltr));
  });
});
