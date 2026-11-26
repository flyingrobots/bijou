import { describe, expect, it } from 'vitest';
import { enumeratedList } from './enumerated-list.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.part04.js';
import type { OutputMode } from '../detect/tty.js';

function ctxFor(mode: OutputMode, direction?: 'ltr' | 'rtl') {
  return createTestContext({ mode, ...(direction ? { direction } : {}) });
}

describe('enumeratedList direction', () => {
  it('ltr interactive keeps today\'s layout', () => {
    expect(enumeratedList(['One', 'Two'], { ctx: ctxFor('interactive', 'ltr') })).toBe('  1. One\n  2. Two');
  });

  it('rtl puts the number on the right edge with the indent after it, keeping its text', () => {
    expect(enumeratedList(['One', 'Two'], { ctx: ctxFor('interactive', 'rtl') })).toBe('One 1.  \nTwo 2.  ');
  });

  it('rtl keeps right-aligned multi-digit numbers and pads lines to the widest', () => {
    const items = ['a', 'bb', 'ccc'];
    expect(enumeratedList(items, { start: 9, indent: 0, ctx: ctxFor('interactive', 'rtl') }))
      .toBe('  a  9.\n bb 10.\nccc 11.');
  });

  it('rtl bullets sit on the start side; the bullet glyph is not directional and is unchanged', () => {
    expect(enumeratedList(['x', 'yy'], { style: 'bullet', ctx: ctxFor('interactive', 'rtl') })).toBe(' x •  \nyy •  ');
    expect(enumeratedList(['x'], { style: 'dash', indent: 0, ctx: ctxFor('static', 'rtl') })).toBe('x –');
  });

  it('rtl style none indents on the right', () => {
    expect(enumeratedList(['a', 'bbb'], { style: 'none', ctx: ctxFor('interactive', 'rtl') })).toBe('  a  \nbbb  ');
  });

  it('rtl continuation lines stay under the first content line, right aligned', () => {
    expect(enumeratedList(['one\ntwo words'], { indent: 0, ctx: ctxFor('interactive', 'rtl') }))
      .toBe('      one 1.\ntwo words   ');
  });

  it('measures wide and combining text by display width', () => {
    const lines = enumeratedList(['ホーム', 'café'], { ctx: ctxFor('interactive', 'rtl') }).split('\n');
    expect(lines.map((l) => graphemeWidth(l))).toEqual([11, 11]);
    expect(lines[1]).toBe('  café 2.  ');
  });

  it('applies without a context when a direction is given', () => {
    expect(enumeratedList(['One'], { direction: 'rtl', indent: 0 })).toBe('One 1.');
    expect(enumeratedList(['One'], { indent: 0 })).toBe('1. One');
  });

  it('an explicit direction overrides the context', () => {
    expect(enumeratedList(['One'], { direction: 'ltr', ctx: ctxFor('interactive', 'rtl') })).toBe('  1. One');
  });

  it('rtl pipe and accessible output stay in logical order', () => {
    expect(enumeratedList(['One', 'Two'], { ctx: ctxFor('pipe', 'rtl') })).toBe('  1. One\n  2. Two');
    expect(enumeratedList(['One', 'Two'], { style: 'bullet', ctx: ctxFor('pipe', 'rtl') })).toBe('  * One\n  * Two');
    expect(enumeratedList(['One', 'Two'], { ctx: ctxFor('accessible', 'rtl') })).toBe('  1. One\n  2. Two');
  });

  it('never alters item text: paths, ids and commands stay intact', () => {
    expect(enumeratedList(['/usr/bin', 'ID-1'], { indent: 0, ctx: ctxFor('interactive', 'rtl') }))
      .toBe('/usr/bin 1.\n    ID-1 2.');
  });
});
