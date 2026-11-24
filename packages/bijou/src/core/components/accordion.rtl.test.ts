import { describe, expect, it } from 'vitest';
import { accordion, type AccordionSection } from './accordion.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.part04.js';
import type { OutputMode } from '../detect/tty.js';

const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Body text', expanded: true },
  { title: 'Beta', content: 'Hidden' },
];

function ctxFor(mode: OutputMode, direction?: 'ltr' | 'rtl') {
  return createTestContext({ mode, ...(direction ? { direction } : {}) });
}

describe('accordion direction', () => {
  it('ltr interactive keeps today\'s layout', () => {
    expect(accordion(sections, { ctx: ctxFor('interactive', 'ltr') })).toBe('▼ Alpha\n  Body text\n\n▶ Beta');
  });

  it('rtl puts the disclosure glyph on the right, indents content from the right and mirrors ▶', () => {
    expect(accordion(sections, { ctx: ctxFor('interactive', 'rtl') }))
      .toBe('    Alpha ▼\nBody text  \n\n     Beta ◀');
  });

  it('rtl static mirrors like interactive; an explicit direction overrides the context', () => {
    const rtl = accordion(sections, { ctx: ctxFor('interactive', 'rtl') });
    expect(accordion(sections, { ctx: ctxFor('static', 'rtl') })).toBe(rtl);
    expect(accordion(sections, { ctx: ctxFor('interactive', 'ltr'), direction: 'rtl' })).toBe(rtl);
    expect(accordion(sections, { ctx: ctxFor('interactive', 'rtl'), direction: 'ltr' }))
      .toBe(accordion(sections, { ctx: ctxFor('interactive', 'ltr') }));
  });

  it('keeps the non-directional ▼ unchanged and mirrors only the collapsed glyph', () => {
    const open = accordion([{ title: 'T', content: 'c', expanded: true }], { ctx: ctxFor('interactive', 'rtl') });
    const shut = accordion([{ title: 'T' , content: 'c' }], { ctx: ctxFor('interactive', 'rtl') });
    expect(open).toContain('T ▼');
    expect(shut).toBe('T ◀');
  });

  it('pads every non-blank line to the widest and handles wide and combining text', () => {
    const wide: AccordionSection[] = [{ title: '設定', content: 'café\nホーム ホーム', expanded: true }];
    const lines = accordion(wide, { ctx: ctxFor('interactive', 'rtl') }).split('\n');
    expect(lines.map((l) => graphemeWidth(l))).toEqual([15, 15, 15]);
    expect(lines[0]).toBe('         設定 ▼');
    expect(lines[1]).toBe('         café  ');
  });

  it('rtl pipe and accessible output stay in logical order', () => {
    expect(accordion(sections, { ctx: ctxFor('pipe', 'rtl') })).toBe('# Alpha\nBody text\n\n# Beta\nHidden');
    expect(accordion(sections, { ctx: ctxFor('accessible', 'rtl') }))
      .toBe('[expanded] Alpha: Body text\n[collapsed] Beta');
  });

  it('never alters content text: paths, ids and commands stay intact', () => {
    const out = accordion([{ title: 'ID-7', content: '/usr/bin --flag', expanded: true }], { ctx: ctxFor('interactive', 'rtl') });
    expect(out).toContain('/usr/bin --flag  ');
  });

  it('fills the header background under rtl', () => {
    const ctx = createTestContext({ mode: 'interactive', direction: 'rtl' });
    const out = accordion(sections, { headerBgToken: { hex: '#ffffff', bg: '#001122' }, ctx });
    expect(out).toContain('Alpha ▼');
  });
});
