import { describe, it, expect } from 'vitest';
import { graphemeClusterWidth } from './grapheme.js';

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
