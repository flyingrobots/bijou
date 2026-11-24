import { describe, expect, it } from 'vitest';
import { breadcrumb } from './breadcrumb.js';
import { createTestContext } from '../../adapters/test/index.js';
import { plainStyle } from '../../adapters/test/style.js';
import { graphemeWidth } from '../text/grapheme.part04.js';
import type { OutputMode } from '../detect/tty.js';
import type { StylePort } from '../../ports/style.js';

const items = ['Home', 'Settings', 'Profile'];

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

describe('breadcrumb direction', () => {
  it('ltr interactive keeps today\'s flow and styles the last item as current', () => {
    expect(breadcrumb(items, { ctx: ctxFor('interactive', 'ltr') }))
      .toBe('<m>Home</m> › <m>Settings</m> › <b>Profile</b>');
  });

  it('rtl interactive reads right to left, mirrors the separator and keeps the current item styled', () => {
    expect(breadcrumb(items, { ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<b>Profile</b> ‹ <m>Settings</m> ‹ <m>Home</m>');
  });

  it('rtl static mirrors like interactive', () => {
    expect(breadcrumb(items, { ctx: ctxFor('static', 'rtl') }))
      .toBe('<b>Profile</b> ‹ <m>Settings</m> ‹ <m>Home</m>');
  });

  it('an explicit direction option overrides the context in both directions', () => {
    expect(breadcrumb(items, { ctx: ctxFor('interactive', 'ltr'), direction: 'rtl' }))
      .toBe('<b>Profile</b> ‹ <m>Settings</m> ‹ <m>Home</m>');
    expect(breadcrumb(items, { ctx: ctxFor('interactive', 'rtl'), direction: 'ltr' }))
      .toBe('<m>Home</m> › <m>Settings</m> › <b>Profile</b>');
  });

  it('rtl pipe and accessible output stay in logical order', () => {
    expect(breadcrumb(items, { ctx: ctxFor('pipe', 'rtl') })).toBe('Home > Settings > Profile');
    expect(breadcrumb(items, { ctx: ctxFor('accessible', 'rtl') }))
      .toBe('Breadcrumb: Home > Settings > Profile (current)');
  });

  it('mirrors a directional custom separator glyph by glyph', () => {
    const pairs: readonly (readonly [string, string])[] = [['›', '‹'], ['»', '«'], ['→', '←'], ['▸', '◂'], ['▶', '◀']];
    for (const [ltr, rtl] of pairs) {
      const sep = ` ${ltr} `;
      expect(breadcrumb(['A', 'B'], { separator: sep, ctx: ctxFor('interactive', 'rtl') })).toBe(`<b>B</b> ${rtl} <m>A</m>`);
      expect(breadcrumb(['A', 'B'], { separator: ` ${rtl} `, ctx: ctxFor('interactive', 'rtl') })).toBe(`<b>B</b> ${ltr} <m>A</m>`);
    }
  });

  it('keeps an ASCII custom separator unmirrored, since it may be code or a path', () => {
    expect(breadcrumb(['usr', 'bin'], { separator: ' / ', ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<b>bin</b> / <m>usr</m>');
    expect(breadcrumb(['a', 'b'], { separator: ' > ', ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<b>b</b> > <m>a</m>');
  });

  it('never reverses or alters label text: paths, ids and commands stay intact', () => {
    const labels = ['/usr/local/bin', 'ID-4021', 'git commit -m "x"'];
    expect(breadcrumb(labels, { ctx: ctxFor('interactive', 'rtl') }))
      .toBe('<b>git commit -m "x"</b> ‹ <m>ID-4021</m> ‹ <m>/usr/local/bin</m>');
  });

  it('keeps display width identical across directions with wide and combining labels', () => {
    const labels = ['ホーム', 'café', '設定'];
    const strip = (s: string) => s.replace(/<\/?[bm]>/g, '');
    const ltr = strip(breadcrumb(labels, { ctx: ctxFor('interactive', 'ltr') }));
    const rtl = strip(breadcrumb(labels, { ctx: ctxFor('interactive', 'rtl') }));
    expect(graphemeWidth(rtl)).toBe(graphemeWidth(ltr));
    expect(rtl).toBe('設定 ‹ café ‹ ホーム');
  });

  it('handles single and empty trails under rtl', () => {
    expect(breadcrumb(['Home'], { ctx: ctxFor('interactive', 'rtl') })).toBe('<b>Home</b>');
    expect(breadcrumb([], { ctx: ctxFor('interactive', 'rtl') })).toBe('');
  });

  it('applies currentBgToken to the current item under rtl', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    const out = breadcrumb(items, { currentBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
    expect(out.indexOf('Profile')).toBeLessThan(out.indexOf('Settings'));
    expect(out.indexOf('Settings')).toBeLessThan(out.indexOf('Home'));
    expect(out).toContain(' Profile ');
  });
});
