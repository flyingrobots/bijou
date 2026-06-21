import { describe, it, expect } from 'vitest';
import { box, headerBox } from './box.js';
import { createTestContext } from '../../adapters/test/index.js';
import { graphemeWidth } from '../text/grapheme.js';
import { must } from '@flyingrobots/bijou/adapters/test';

describe('box() with width override', () => {
  it('wraps long content lines by default when a fixed width is provided', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('ABCDEFGHIJ', { width: 8, ctx });
    const lines = result.split('\n');
    expect(lines[1]).toContain('ABCD');
    expect(lines[2]).toContain('EFGH');
    expect(lines[3]).toContain('IJ');
  });
  it('supports per-instance truncate overflow overrides', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('ABCDEFGHIJ', { width: 8, overflow: 'truncate', ctx });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('ABCD');
    expect(lines[1]).not.toContain('EFGH');
  });
  it('outer width matches specified width exactly', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { width: 20, ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(20);
    }
  });
  it('short content lines right-padded to fill interior', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Hi', { width: 20, ctx });
    const lines = result.split('\n');
    // Content line (middle) should be padded to width 20
    expect(graphemeWidth(must(lines[1]))).toBe(20);
  });
  it('long content lines clip to interior width when overflow is truncate', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('This is a very long line of text', { width: 12, overflow: 'truncate', ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(12);
    }
  });
  it('padding subtracted from width for interior', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    // width=10, padding left=2, right=2 → inner=8, content=4
    const result = box('ABCDEFGH', { width: 10, padding: { left: 2, right: 2 }, ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(10);
    }
    // Content should be clipped to 4 chars
    expect(lines[1]).toContain('ABCD');
    expect(lines[1]).not.toContain('ABCDE');
  });
  it('width < minimum (border + padding) results in zero-width interior', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    // width=2 → inner=0, content=0
    const result = box('Hello', { width: 2, ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(2);
    }
  });
  it('visibleLength of every output line equals specified width', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = box('Line 1\nLonger Line 2\nL3', { width: 30, ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(30);
    }
  });
  it('pipe mode ignores width', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(box('Hello', { width: 20, ctx })).toBe('Hello');
  });
  it('accessible mode ignores width', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(box('Hello', { width: 20, ctx })).toBe('Hello');
  });
  it('headerBox() with width passes through to box', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = headerBox('Title', { width: 30, detail: 'info', ctx });
    const lines = result.split('\n');
    for (const line of lines) {
      expect(graphemeWidth(line)).toBe(30);
    }
  });
});
