import { describe, expect, it } from 'vitest';
import { graphemeClusterWidth, segmentGraphemes } from './grapheme.js';

// Cluster classes whose width a per-code-point sum would change, pinned so the
// spacing-unit rule of flyingrobots/bijou#854 and flyingrobots/bijou#855 cannot
// regress them. A plain wcwidth sum measures each of these wrong: it counts
// every joined pictograph, both flag letters and the skin-tone swatch, and it
// drops the emoji presentation that VS16 gives a narrow base.

const fromCodes = (...codes: number[]): string => String.fromCodePoint(...codes);

function expectOneClusterOfWidth(cluster: string, width: number): void {
  expect(segmentGraphemes(cluster)).toEqual([cluster]);
  expect(graphemeClusterWidth(cluster)).toBe(width);
}

describe('emoji sequences keep two cells', () => {
  it('measures ZWJ sequences as two cells', () => {
    // 🏳️‍🌈 rainbow flag, ❤️‍🔥 heart on fire, 🧑🏽‍💻 technologist with a tone.
    expectOneClusterOfWidth(fromCodes(0x1f3f3, 0xfe0f, 0x200d, 0x1f308), 2);
    expectOneClusterOfWidth(fromCodes(0x2764, 0xfe0f, 0x200d, 0x1f525), 2);
    expectOneClusterOfWidth(fromCodes(0x1f9d1, 0x1f3fd, 0x200d, 0x1f4bb), 2);
  });

  it('measures a regional-indicator flag pair as two cells', () => {
    // 🇯🇵 and 🇰🇷: two regional indicators, one flag.
    expectOneClusterOfWidth(fromCodes(0x1f1ef, 0x1f1f5), 2);
    expectOneClusterOfWidth(fromCodes(0x1f1f0, 0x1f1f7), 2);
  });

  it('measures a skin-tone modifier sequence as two cells', () => {
    expectOneClusterOfWidth(fromCodes(0x1f44d, 0x1f3fb), 2);
  });

  it('measures keycap sequences as two cells', () => {
    // 1️⃣ and #️⃣: a narrow base, VS16 and the combining enclosing keycap.
    expectOneClusterOfWidth(fromCodes(0x31, 0xfe0f, 0x20e3), 2);
    expectOneClusterOfWidth(fromCodes(0x23, 0xfe0f, 0x20e3), 2);
  });

  it('measures a narrow base with VS16 emoji presentation as two cells', () => {
    // ❤️ and ✂️: Narrow text characters drawn as emoji.
    expectOneClusterOfWidth(fromCodes(0x2764, 0xfe0f), 2);
    expectOneClusterOfWidth(fromCodes(0x2702, 0xfe0f), 2);
  });

  it('measures an emoji tag sequence as two cells', () => {
    // 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland: black flag + tag characters + cancel tag.
    expectOneClusterOfWidth(
      fromCodes(0x1f3f4, 0xe0067, 0xe0062, 0xe0073, 0xe0063, 0xe0074, 0xe007f),
      2,
    );
  });
});

describe('extenders that add no cell', () => {
  it('keeps combining marks inside the base cell', () => {
    // か + combining voiced mark U+3099 = 2; ｶ + U+0301 = 1.
    expectOneClusterOfWidth(fromCodes(0x304b, 0x3099), 2);
    expectOneClusterOfWidth(fromCodes(0xff76, 0x301), 1);
  });

  it('keeps a final jamo after a precomposed syllable inside two cells', () => {
    // 하 (U+D558) + final U+11AB is one cluster drawn as 한.
    expectOneClusterOfWidth(fromCodes(0xd558, 0x11ab), 2);
  });
});
