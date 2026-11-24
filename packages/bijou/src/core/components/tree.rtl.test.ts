import { describe, expect, it } from 'vitest';
import { tree, type TreeNode } from './tree.js';
import { mirrorTreeGlyphs } from './tree-rtl.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.part04.js';
import type { OutputMode } from '../detect/tty.js';

const nodes: TreeNode[] = [
  { label: 'src', children: [{ label: 'index.ts' }, { label: 'utils.ts' }] },
  { label: 'README.md' },
];

function ctxFor(mode: OutputMode, direction?: 'ltr' | 'rtl') {
  return createTestContext({ mode, ...(direction ? { direction } : {}) });
}

describe('tree direction', () => {
  it('ltr interactive keeps today\'s connectors', () => {
    expect(tree(nodes, { ctx: ctxFor('interactive', 'ltr') })).toBe(
      ['├─ src', '│  ├─ index.ts', '│  └─ utils.ts', '└─ README.md'].join('\n'),
    );
  });

  it('rtl interactive indents from the right with mirrored connectors, padded to the widest line', () => {
    expect(tree(nodes, { ctx: ctxFor('interactive', 'rtl') })).toBe(
      [
        '        src ─┤',
        'index.ts ─┤  │',
        'utils.ts ─┘  │',
        '  README.md ─┘',
      ].join('\n'),
    );
  });

  it('rtl static mirrors like interactive, and an explicit direction overrides the context', () => {
    const rtl = tree(nodes, { ctx: ctxFor('interactive', 'rtl') });
    expect(tree(nodes, { ctx: ctxFor('static', 'rtl') })).toBe(rtl);
    expect(tree(nodes, { ctx: ctxFor('interactive', 'ltr'), direction: 'rtl' })).toBe(rtl);
    expect(tree(nodes, { ctx: ctxFor('interactive', 'rtl'), direction: 'ltr' }))
      .toBe(tree(nodes, { ctx: ctxFor('interactive', 'ltr') }));
  });

  it('pads to the widest line, so every line has the same display width', () => {
    const deep: TreeNode[] = [{ label: 'a', children: [{ label: 'b', children: [{ label: 'ホーム' }] }] }];
    const lines = tree(deep, { ctx: ctxFor('interactive', 'rtl') }).split('\n');
    expect(lines.map((l) => graphemeWidth(l))).toEqual([15, 15, 15]);
    expect(lines[2]).toBe('ホーム ─┘      ');
  });

  it('keeps wide and combining labels intact and aligned', () => {
    const labels: TreeNode[] = [{ label: 'café' }, { label: '設定' }];
    expect(tree(labels, { ctx: ctxFor('interactive', 'rtl') }))
      .toBe('café ─┤\n設定 ─┘');
  });

  it('rtl pipe and accessible output stay in logical, top-to-bottom order', () => {
    expect(tree(nodes, { ctx: ctxFor('pipe', 'rtl') }))
      .toBe('src\n  index.ts\n  utils.ts\nREADME.md');
    expect(tree(nodes, { ctx: ctxFor('accessible', 'rtl') }))
      .toBe('src (contains 2 items)\n  index.ts\n  utils.ts\nREADME.md');
  });

  it('never reverses or alters labels: paths, ids and commands stay intact', () => {
    const out = tree([{ label: '/usr/local/bin' }, { label: 'git commit -m "x"' }], { ctx: ctxFor('interactive', 'rtl') });
    expect(out).toContain('/usr/local/bin ─┤');
    expect(out).toContain('git commit -m "x" ─┘');
  });

  it('handles an empty tree under rtl', () => {
    expect(tree([], { ctx: ctxFor('interactive', 'rtl') })).toBe('');
  });
});

describe('mirrorTreeGlyphs', () => {
  const pairs: readonly (readonly [string, string])[] = [
    ['├', '┤'], ['┤', '├'], ['└', '┘'], ['┘', '└'], ['┌', '┐'], ['┐', '┌'], ['│', '│'], ['─', '─'],
  ];
  for (const [ltr, rtl] of pairs) {
    it(`maps ${ltr} to ${rtl}`, () => {
      expect(mirrorTreeGlyphs(ltr)).toBe(rtl);
    });
  }

  it('reverses a whole connector segment and mirrors it', () => {
    expect(mirrorTreeGlyphs('├─ ')).toBe(' ─┤');
    expect(mirrorTreeGlyphs('└─ ')).toBe(' ─┘');
    expect(mirrorTreeGlyphs('│  ')).toBe('  │');
  });

  it('leaves ASCII fallback glyphs and text alone', () => {
    expect(mirrorTreeGlyphs('|-- ')).toBe(' --|');
    expect(mirrorTreeGlyphs('`-- ')).toBe(' --`');
  });
});
