// The hand-written wide table `isWideChar()` used before flyingrobots/bijou#860,
// copied from packages/bijou/src/core/text/grapheme.part01.ts at commit
// 7ba774c8 (origin/main). The width report compares it with the generated
// table under the same cluster rule. It is a frozen baseline, not used at runtime.

const LEGACY_WIDE_RANGES: readonly (readonly [number, number])[] = [
  [0xff01, 0xff60], // Fullwidth Forms
  [0xffe0, 0xffe6],
  [0x2e80, 0x2fdf], // CJK Radicals, Kangxi Radicals
  [0x3000, 0x33ff], // CJK Symbols and Punctuation, kana, Enclosed CJK, CJK Compatibility
  [0x3400, 0x4dbf], // CJK Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xac00, 0xd7a3], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe30, 0xfe4f], // CJK Compatibility Forms
  [0x20000, 0x3ffff], // CJK Extension B and beyond
  [0x1f300, 0x1f9ff], // Misc Symbols and Pictographs .. Supplemental Symbols
  [0x1fa00, 0x1faff], // Chess Symbols, Symbols and Pictographs Extended-A
  [0x1f600, 0x1f64f], // Emoticons
  [0x1f680, 0x1f6ff], // Transport and Map Symbols
  [0x1f1e0, 0x1f1ff], // Regional indicators
  [0x1f000, 0x1f02f], // Mahjong Tiles
];

/** `isWideChar()` as it was at 7ba774c8. */
export function isLegacyWideChar(cp: number): boolean {
  return LEGACY_WIDE_RANGES.some(([first, last]) => cp >= first && cp <= last);
}
