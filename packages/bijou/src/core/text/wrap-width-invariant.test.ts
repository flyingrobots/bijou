import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { graphemeWidth, segmentGraphemes } from './grapheme.js';
import { wrapToWidth } from './wrap.js';

// The invariant wrapToWidth holds (flyingrobots/bijou#853): for every input
// and every width at least as large as the widest single grapheme, every
// returned line is at most that many cells wide, and every grapheme that is
// not whitespace comes out once, in order. Whitespace is the only thing a
// break may drop. Widths start at 2 because a two-cell grapheme cannot fit
// width 1 (flyingrobots/bijou#852 needs a decision).

const NARROW = ['a', 'Z', '7', 'ｶ', '±'];
const WIDE = ['漢', '字', '。', 'の', 'テ', '한', 'Ａ', '，'];
// Base plus combining mark: one grapheme each (e + U+0301, a + U+0308,
// か + U+3099).
const COMBINING = ['é', 'ä', 'が'];
// Every one of these matches \s, so wrapToWidth may break at it. U+3000 is
// the two-cell ideographic space.
const WHITESPACE = [' ', ' ', ' ', '\t', ' ', '　'];
const ALPHABET = [...NARROW, ...WIDE, ...COMBINING, ...WHITESPACE];

function isWhitespace(grapheme: string): boolean {
  return /^\s+$/.test(grapheme);
}

function visible(graphemes: readonly string[]): string[] {
  return graphemes.filter((grapheme) => !isWhitespace(grapheme));
}

function assertInvariant(parts: readonly string[], width: number): void {
  const lines = wrapToWidth(parts.join(''), width);
  for (const line of lines) {
    expect(graphemeWidth(line)).toBeLessThanOrEqual(width);
  }
  const kept = lines.flatMap((line) => segmentGraphemes(line));
  expect(visible(kept)).toEqual(visible(parts));
}

describe('wrapToWidth width invariant', () => {
  it('holds over seeded mixed text, leading whitespace included', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ALPHABET), { maxLength: 200 }),
        fc.integer({ min: 2, max: 120 }),
        (parts, width) => {
          assertInvariant(parts, width);
        },
      ),
      { seed: 853, numRuns: 1000 },
    );
  });

  it('holds when every line starts with whitespace', () => {
    const line = fc.tuple(
      fc.array(fc.constantFrom(...WHITESPACE), { minLength: 1, maxLength: 4 }),
      fc.array(fc.constantFrom(...ALPHABET), { maxLength: 60 }),
    ).map(([lead, rest]) => [...lead, ...rest]);
    fc.assert(
      fc.property(
        fc.array(line, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 2, max: 120 }),
        (lines, width) => {
          for (const parts of lines) assertInvariant(parts, width);
          const joined = lines.map((parts) => parts.join('')).join('\n');
          for (const out of wrapToWidth(joined, width)) {
            expect(graphemeWidth(out)).toBeLessThanOrEqual(width);
          }
        },
      ),
      { seed: 8530, numRuns: 1000 },
    );
  });

  it('holds at every width for a narrow run that ends in a wide grapheme', () => {
    // Exhaustive over the shape that broke: one leading whitespace, a run of
    // n narrow or wide graphemes, then a two-cell grapheme.
    for (let width = 2; width <= 120; width++) {
      for (const lead of [' ', '\t', ' ', '　', '']) {
        for (const filler of ['a', '漢']) {
          const count = Math.floor(width / graphemeWidth(filler));
          for (const n of [count - 1, count, count + 1]) {
            const run = Array<string>(Math.max(0, n)).fill(filler);
            const parts = lead === '' ? [...run, '。'] : [lead, ...run, '。'];
            assertInvariant(parts, width);
          }
        }
      }
    }
  });
});
