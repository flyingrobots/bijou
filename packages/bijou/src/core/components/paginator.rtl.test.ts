import { describe, expect, it } from 'vitest';
import { paginator } from './paginator.js';
import { createTestContext } from '../../adapters/test/index.js';
import { plainStyle } from '../../adapters/test/style.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import type { OutputMode } from '../detect/tty.js';
import type { StylePort } from '../../ports/style.js';

/** Style that tags every styled segment `<m>`. */
function taggedStyle(): StylePort {
  return { ...plainStyle(), styled: (_token, text) => `<m>${text}</m>` };
}

function ctxFor(mode: OutputMode, direction?: 'ltr' | 'rtl') {
  return createTestContext({ mode, style: taggedStyle(), ...(direction ? { direction } : {}) });
}

describe('paginator direction', () => {
  it('ltr dots keep today\'s order', () => {
    expect(paginator({ current: 1, total: 4, ctx: ctxFor('interactive', 'ltr') }))
      .toBe('<m>○</m> <m>●</m> <m>○</m> <m>○</m>');
    expect(paginator({ current: 1, total: 4, ctx: ctxFor('interactive') }))
      .toBe('<m>○</m> <m>●</m> <m>○</m> <m>○</m>');
  });

  it('rtl dots run right to left: page one is rightmost and the current dot follows its page', () => {
    for (const mode of ['interactive', 'static'] as const) {
      expect(paginator({ current: 1, total: 4, ctx: ctxFor(mode, 'rtl') }))
        .toBe('<m>○</m> <m>○</m> <m>●</m> <m>○</m>');
      expect(paginator({ current: 0, total: 3, ctx: ctxFor(mode, 'rtl') }))
        .toBe('<m>○</m> <m>○</m> <m>●</m>');
    }
  });

  it('the next page stays logically next: right of current in ltr, left of current in rtl', () => {
    const at = (direction: 'ltr' | 'rtl', current: number) =>
      paginator({ current, total: 3, direction, ctx: createTestContext({ mode: 'interactive' }) }).indexOf('●');
    expect(at('ltr', 1)).toBeLessThan(at('ltr', 2));
    expect(at('rtl', 1)).toBeGreaterThan(at('rtl', 2));
  });

  it('an explicit direction option overrides the context in both directions', () => {
    expect(paginator({ current: 0, total: 3, direction: 'rtl', ctx: ctxFor('interactive', 'ltr') }))
      .toBe('<m>○</m> <m>○</m> <m>●</m>');
    expect(paginator({ current: 0, total: 3, direction: 'ltr', ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<m>●</m> <m>○</m> <m>○</m>');
  });

  it('text style, pipe and accessible output keep their digits and reading order under rtl', () => {
    expect(paginator({ current: 1, total: 4, style: 'text', ctx: ctxFor('interactive', 'rtl') })).toBe('Page 2 of 4');
    expect(paginator({ current: 1, total: 4, ctx: ctxFor('pipe', 'rtl') })).toBe('[2/4]');
    expect(paginator({ current: 1, total: 4, ctx: ctxFor('accessible', 'rtl') })).toBe('Page 2 of 4');
  });

  it('emits no directional glyph: both dots are symmetric', () => {
    for (const glyph of ['●', '○']) expect(mirrorGlyph(glyph, 'rtl')).toBe(glyph);
  });

  it('clamps and sanitizes the same way under rtl', () => {
    expect(paginator({ current: 99, total: 3, ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<m>●</m> <m>○</m> <m>○</m>');
    expect(paginator({ current: 0, total: 0, ctx: ctxFor('interactive', 'rtl') })).toBe('<m>●</m>');
  });
});
