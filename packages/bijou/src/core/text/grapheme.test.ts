import { describe, it, expect } from 'vitest';
import {
  isWideChar,
  segmentGraphemes,
  graphemeClusterWidth,
  graphemeWidth,
  sanitizeTerminalText,
} from './grapheme.js';

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

describe('segmentGraphemes', () => {
  it('segments ASCII text', () => {
    expect(segmentGraphemes('abc')).toEqual(['a', 'b', 'c']);
  });

  it('segments empty string', () => {
    expect(segmentGraphemes('')).toEqual([]);
  });

  it('treats flag emoji as single grapheme', () => {
    const segments = segmentGraphemes('🇺🇸');
    expect(segments).toHaveLength(1);
    expect(segments[0]).toBe('🇺🇸');
  });

  it('treats ZWJ family as single grapheme', () => {
    const family = '👨‍👩‍👧‍👦';
    const segments = segmentGraphemes(family);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toBe(family);
  });

  it('treats skin tone emoji as single grapheme', () => {
    const wave = '👋🏿';
    const segments = segmentGraphemes(wave);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toBe(wave);
  });

  it('treats combining marks as single grapheme', () => {
    // e + combining acute accent = é
    const composed = 'e\u0301';
    const segments = segmentGraphemes(composed);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toBe(composed);
  });

  it('segments CJK characters individually', () => {
    expect(segmentGraphemes('漢字')).toEqual(['漢', '字']);
  });

  it('segments mixed ASCII and emoji', () => {
    const segments = segmentGraphemes('hi👋🏿!');
    expect(segments).toEqual(['h', 'i', '👋🏿', '!']);
  });
});

describe('graphemeClusterWidth', () => {
  it('returns 1 for ASCII characters', () => {
    expect(graphemeClusterWidth('a')).toBe(1);
    expect(graphemeClusterWidth(' ')).toBe(1);
    expect(graphemeClusterWidth('Z')).toBe(1);
  });

  it('returns 2 for CJK characters', () => {
    expect(graphemeClusterWidth('漢')).toBe(2);
    expect(graphemeClusterWidth('字')).toBe(2);
  });

  it('returns 2 for emoji', () => {
    expect(graphemeClusterWidth('😀')).toBe(2);
    expect(graphemeClusterWidth('🚀')).toBe(2);
  });

  it('returns 2 for flag emoji', () => {
    expect(graphemeClusterWidth('🇺🇸')).toBe(2);
  });

  it('returns 2 for ZWJ family', () => {
    expect(graphemeClusterWidth('👨‍👩‍👧‍👦')).toBe(2);
  });

  it('returns 2 for skin tone emoji', () => {
    expect(graphemeClusterWidth('👋🏿')).toBe(2);
  });

  it('returns 1 for combining mark sequences', () => {
    expect(graphemeClusterWidth('e\u0301')).toBe(1);
  });

  it('returns 2 for fullwidth forms', () => {
    expect(graphemeClusterWidth('Ａ')).toBe(2);
  });

  it('keeps text-presentation status symbols narrow', () => {
    expect(graphemeClusterWidth('⚠\uFE0E')).toBe(1);
    expect(graphemeClusterWidth('ℹ\uFE0E')).toBe(1);
    expect(graphemeClusterWidth('✗\uFE0E')).toBe(1);
  });
});

describe('graphemeWidth', () => {
  it('returns 0 for empty string', () => {
    expect(graphemeWidth('')).toBe(0);
  });

  it('counts ASCII characters as 1 each', () => {
    expect(graphemeWidth('hello')).toBe(5);
    expect(graphemeWidth('abc 123')).toBe(7);
  });

  it('counts CJK characters as 2 each', () => {
    expect(graphemeWidth('漢字')).toBe(4);
  });

  it('counts mixed ASCII and CJK', () => {
    expect(graphemeWidth('hi漢字!')).toBe(7); // 2 + 4 + 1
  });

  it('counts flag emoji as 2 columns', () => {
    expect(graphemeWidth('🇺🇸')).toBe(2);
  });

  it('counts ZWJ family as 2 columns', () => {
    expect(graphemeWidth('👨‍👩‍👧‍👦')).toBe(2);
  });

  it('counts skin tone emoji as 2 columns', () => {
    expect(graphemeWidth('👋🏿')).toBe(2);
  });

  it('counts combining mark character as 1 column', () => {
    expect(graphemeWidth('e\u0301')).toBe(1);  // é
  });

  it('strips ANSI escapes before measuring', () => {
    expect(graphemeWidth('\x1b[31mhello\x1b[0m')).toBe(5);
    expect(graphemeWidth('\x1b[1;32m漢字\x1b[0m')).toBe(4);
  });

  it('returns 0 for ANSI-only strings', () => {
    expect(graphemeWidth('\x1b[31m\x1b[0m')).toBe(0);
  });

  it('handles multiple emoji in sequence', () => {
    expect(graphemeWidth('🚀🎉💯')).toBe(6); // 3 emoji × 2 columns
  });

  it('handles mixed content', () => {
    // "Hello 漢字 🇺🇸!" = 5 + 1 + 4 + 1 + 2 + 1 = 14
    expect(graphemeWidth('Hello 漢字 🇺🇸!')).toBe(14);
  });
});

describe('sanitizeTerminalText', () => {
  it('removes destructive ANSI sequences and control characters', () => {
    const text = sanitizeTerminalText('A\x1b[2JB\bC\rD\tE\u0007');
    expect(text).toBe('ABC\nD  E');
  });

  it('preserves SGR styling only when explicitly allowed', () => {
    expect(sanitizeTerminalText('\x1b[31mred\x1b[0m')).toBe('red');
    expect(sanitizeTerminalText('\x1b[31mred\x1b[0m', { allowAnsiStyling: true })).toBe('\x1b[31mred\x1b[0m');
  });

  it('preserves OSC 8 hyperlinks only when explicitly allowed', () => {
    const linked = '\x1b]8;;https://example.com\x1b\\bijou\x1b]8;;\x1b\\';
    expect(sanitizeTerminalText(linked)).toBe('bijou');
    expect(sanitizeTerminalText(linked, { allowHyperlinks: true })).toBe(linked);
  });
});
