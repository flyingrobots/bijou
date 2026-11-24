import { describe, expect, it } from 'vitest';
import { decodeLiteral, stringLiterals } from './width-corpus.js';
import { compareWidths } from './width-consequences-model.js';
import type { WidthUcd } from './width-ucd.js';

describe('width report corpus helpers', () => {
  it('decodes escapes in string literals', () => {
    expect(decodeLiteral('a\\u0301\\u{1F600}\\x41\\n\\\'')).toBe('á\u{1F600}A\n\'');
  });

  it('collects quoted, template and fromCodePoint literals', () => {
    const source = "f('漢'); g(\"⌚\"); h(`ｶ`); i(`${x}`); String.fromCodePoint(0x3248);";
    expect(stringLiterals(source)).toEqual(['漢', '⌚', 'ｶ', '㉈']);
  });
});

describe('compareWidths', () => {
  const ucd: WidthUcd = {
    inputs: [],
    assigned: new Map([
      [0x41, { eastAsianWidth: 'Na', generalCategory: 'Lu' }],
      [0x231a, { eastAsianWidth: 'W', generalCategory: 'So' }],
      [0x3248, { eastAsianWidth: 'A', generalCategory: 'No' }],
    ]),
    blockOf: (cp) => (cp < 0x80 ? 'Basic Latin' : cp < 0x2400 ? 'Miscellaneous Technical' : 'Enclosed CJK'),
    emojiSequences: ['⌚'],
  };
  const before = (cluster: string): number => (cluster.includes('㉈') ? 2 : 1);
  const after = (cluster: string): number => (cluster.includes('⌚') ? 2 : 1);

  it('groups changed code points and clusters by block and direction', () => {
    const result = compareWidths({
      ucd,
      corpus: [{ source: 'test-literal', strings: ['A⌚', '㉈'] }],
      before,
      after,
      segment: (text) => [...text],
    });
    expect(result.groups.map((g) => [g.kind, g.source, g.block, g.direction, g.count])).toEqual([
      ['cluster', 'emoji-test', 'Miscellaneous Technical', '1->2', 1],
      ['cluster', 'test-literal', 'Enclosed CJK', '2->1', 1],
      ['cluster', 'test-literal', 'Miscellaneous Technical', '1->2', 1],
      ['code-point', 'assigned', 'Enclosed CJK', '2->1', 1],
      ['code-point', 'assigned', 'Miscellaneous Technical', '1->2', 1],
    ]);
    expect(result.sources.map((s) => [s.source, s.clusters, s.changed])).toEqual([
      ['assigned', 3, 2],
      ['test-literal', 3, 2],
      ['emoji-test', 1, 1],
    ]);
    expect(result.groups[1]?.examples).toEqual(['U+3248 ㉈']);
  });
});
