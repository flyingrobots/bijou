import { describe, it, expect } from 'vitest';
import { isWideChar } from './grapheme.js';

describe('isWideChar', () => {
  it('returns false for ASCII', () => {
    expect(isWideChar(0x41)).toBe(false); // 'A'
    expect(isWideChar(0x7A)).toBe(false); // 'z'
    expect(isWideChar(0x20)).toBe(false); // space
  });

  it('returns true for CJK Unified Ideographs', () => {
    expect(isWideChar(0x4E00)).toBe(true);  // '一'
    expect(isWideChar(0x6F22)).toBe(true);  // '漢'
    expect(isWideChar(0x9FFF)).toBe(true);  // end of block
  });

  it('returns true for Fullwidth Forms', () => {
    expect(isWideChar(0xFF01)).toBe(true);  // '！'
    expect(isWideChar(0xFF21)).toBe(true);  // 'Ａ'
  });

  it('returns true for Hangul', () => {
    expect(isWideChar(0xAC00)).toBe(true);  // '가'
    expect(isWideChar(0xD7A3)).toBe(true);  // last Hangul syllable
  });

  it('returns true for common emoji ranges', () => {
    expect(isWideChar(0x1F600)).toBe(true);  // 😀
    expect(isWideChar(0x1F4A9)).toBe(true);  // 💩
    expect(isWideChar(0x1F680)).toBe(true);  // 🚀
  });

  it('returns true for regional indicators', () => {
    expect(isWideChar(0x1F1FA)).toBe(true);  // regional indicator U
    expect(isWideChar(0x1F1F8)).toBe(true);  // regional indicator S
  });

  it('returns false for combining marks', () => {
    expect(isWideChar(0x0301)).toBe(false);  // combining acute accent
    expect(isWideChar(0x0308)).toBe(false);  // combining diaeresis
  });

  it('returns false for Latin Extended', () => {
    expect(isWideChar(0x00E9)).toBe(false);  // é
    expect(isWideChar(0x00FC)).toBe(false);  // ü
  });
});
