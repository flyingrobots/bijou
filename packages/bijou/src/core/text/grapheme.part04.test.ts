import { describe, it, expect } from 'vitest';
import { graphemeWidth } from './grapheme.js';

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
