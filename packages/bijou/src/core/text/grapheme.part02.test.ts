import { describe, it, expect } from 'vitest';
import { segmentGraphemes } from './grapheme.js';

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
