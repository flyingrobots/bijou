import { describe, expect, it } from 'vitest';
import { stepper } from './stepper.js';
import { createTestContext } from '../../adapters/test/index.js';
import { plainStyle } from '../../adapters/test/style.js';
import { graphemeWidth } from '../text/grapheme.part04.js';
import { mirrorGlyph } from '../direction/directional-glyph.js';
import type { OutputMode } from '../detect/tty.js';
import type { StylePort } from '../../ports/style.js';

const steps = [{ label: 'Account' }, { label: 'Payment' }, { label: 'Confirm' }];

/** Style that tags bold segments `<b>` and every other styled segment `<m>`. */
function taggedStyle(): StylePort {
  return {
    ...plainStyle(),
    styled: (token, text) => (token.modifiers?.includes('bold') ? `<b>${text}</b>` : `<m>${text}</m>`),
  };
}

function ctxFor(mode: OutputMode, direction?: 'ltr' | 'rtl') {
  return createTestContext({ mode, style: taggedStyle(), ...(direction ? { direction } : {}) });
}

const LTR = '<m>✓</m> <m>Account</m> <m>──</m> <m>●</m> <b>Payment</b> <m>──</m> <m>○</m> <m>Confirm</m>';
const RTL = '<m>○</m> <m>Confirm</m> <m>──</m> <m>●</m> <b>Payment</b> <m>──</m> <m>✓</m> <m>Account</m>';

describe('stepper direction', () => {
  it('ltr interactive keeps today\'s order', () => {
    expect(stepper(steps, { current: 1, ctx: ctxFor('interactive', 'ltr') })).toBe(LTR);
    expect(stepper(steps, { current: 1, ctx: ctxFor('interactive') })).toBe(LTR);
  });

  it('rtl interactive and static run the steps right to left with connectors between them', () => {
    for (const mode of ['interactive', 'static'] as const) {
      expect(stepper(steps, { current: 1, ctx: ctxFor(mode, 'rtl') })).toBe(RTL);
    }
  });

  it('the next step stays the logically next one: right of current in ltr, left of current in rtl', () => {
    const ltr = stepper(steps, { current: 1, ctx: ctxFor('interactive', 'ltr') });
    const rtl = stepper(steps, { current: 1, ctx: ctxFor('interactive', 'rtl') });
    expect(ltr.indexOf('Confirm')).toBeGreaterThan(ltr.indexOf('Payment'));
    expect(rtl.indexOf('Confirm')).toBeLessThan(rtl.indexOf('Payment'));
    expect(rtl.indexOf('Account')).toBeGreaterThan(rtl.indexOf('Payment'));
  });

  it('an explicit direction option overrides the context in both directions', () => {
    const base = stepper(steps, { current: 0, ctx: ctxFor('interactive', 'ltr') });
    const forced = stepper(steps, { current: 0, direction: 'rtl', ctx: ctxFor('interactive', 'ltr') });
    expect(forced.indexOf('Confirm')).toBeLessThan(forced.indexOf('Account'));
    expect(base.indexOf('Account')).toBeLessThan(base.indexOf('Confirm'));
    const back = stepper(steps, { current: 0, direction: 'ltr', ctx: ctxFor('interactive', 'rtl') });
    expect(back).toBe(base);
  });

  it('pipe and accessible output stay in logical order under rtl', () => {
    expect(stepper(steps, { current: 1, ctx: ctxFor('pipe', 'rtl') }))
      .toBe('[x] Account -- [*] Payment -- [ ] Confirm');
    expect(stepper(steps, { current: 1, ctx: ctxFor('accessible', 'rtl') }))
      .toBe('Step 2 of 3: Account (complete), Payment (current), Confirm (pending)');
  });

  it('emits no directional glyph: every marker and the connector are symmetric', () => {
    for (const glyph of ['✓', '●', '○', '─', '──']) expect(mirrorGlyph(glyph, 'rtl')).toBe(glyph);
  });

  it('keeps step numbers, paths and ids intact and display width identical with wide and combining labels', () => {
    const labels = [{ label: '1. ホーム' }, { label: 'café' }, { label: '/usr/bin ID-4021' }];
    const strip = (s: string) => s.replace(/<\/?[bm]>/g, '');
    const ltr = strip(stepper(labels, { current: 1, ctx: ctxFor('interactive', 'ltr') }));
    const rtl = strip(stepper(labels, { current: 1, ctx: ctxFor('interactive', 'rtl') }));
    expect(graphemeWidth(rtl)).toBe(graphemeWidth(ltr));
    expect(rtl).toBe('○ /usr/bin ID-4021 ── ● café ── ✓ 1. ホーム');
  });

  it('handles empty and single step lists under rtl', () => {
    expect(stepper([], { current: 0, ctx: ctxFor('interactive', 'rtl') })).toBe('');
    expect(stepper([{ label: 'Only' }], { current: 0, ctx: ctxFor('interactive', 'rtl') })).toBe('<m>●</m> <b>Only</b>');
  });
});
