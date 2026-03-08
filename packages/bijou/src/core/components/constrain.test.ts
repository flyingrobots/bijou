import { describe, it, expect } from 'vitest';
import { constrain } from './constrain.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('constrain', () => {
  describe('maxWidth', () => {
    it('clips long lines with ellipsis', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hello World', { maxWidth: 8, ctx });
      expect(result).toBe('Hello W…');
    });

    it('leaves short lines untouched', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hi', { maxWidth: 10, ctx });
      expect(result).toBe('Hi');
    });

    it('clips multiple lines independently', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hello World\nFoo', { maxWidth: 8, ctx });
      const lines = result.split('\n');
      expect(lines[0]).toBe('Hello W…');
      expect(lines[1]).toBe('Foo');
    });

    it('handles maxWidth=0', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hello', { maxWidth: 0, ctx });
      expect(result).toBe('');
    });

    it('uses custom ellipsis', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hello World', { maxWidth: 9, ellipsis: '...', ctx });
      expect(result).toBe('Hello ...');
    });
  });

  describe('maxHeight', () => {
    it('truncates excess lines with ellipsis', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const content = 'Line 1\nLine 2\nLine 3\nLine 4';
      const result = constrain(content, { maxHeight: 3, ctx });
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Line 1');
      expect(lines[1]).toBe('Line 2');
      expect(lines[2]).toBe('…');
    });

    it('leaves content shorter than maxHeight untouched', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Line 1\nLine 2', { maxHeight: 5, ctx });
      expect(result).toBe('Line 1\nLine 2');
    });

    it('handles maxHeight=0', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Line 1\nLine 2', { maxHeight: 0, ctx });
      expect(result).toBe('');
    });

    it('handles maxHeight=1', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Line 1\nLine 2', { maxHeight: 1, ctx });
      expect(result).toBe('…');
    });
  });

  describe('combined', () => {
    it('applies both width and height constraints', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const content = 'Hello World\nFoo Bar Baz\nThird line\nFourth';
      const result = constrain(content, { maxWidth: 8, maxHeight: 3, ctx });
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Hello W…');
      expect(lines[1]).toBe('Foo Bar…');
      expect(lines[2]).toBe('…');
    });
  });

  describe('mode passthrough', () => {
    it('passes through in pipe mode', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = constrain('Hello World', { maxWidth: 5, maxHeight: 1, ctx });
      expect(result).toBe('Hello World');
    });

    it('passes through in accessible mode', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = constrain('Hello World', { maxWidth: 5, maxHeight: 1, ctx });
      expect(result).toBe('Hello World');
    });

    it('applies in static mode', () => {
      const ctx = createTestContext({ mode: 'static' });
      const result = constrain('Hello World', { maxWidth: 8, ctx });
      expect(result).toBe('Hello W…');
    });

    it('floors fractional maxHeight to integer', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('A\nB\nC\nD', { maxHeight: 2.7, ctx });
      // 2.7 floors to 2 — two lines, last replaced with ellipsis
      expect(result).toBe('A\n…');
    });

    it('floors fractional maxWidth to integer', () => {
      const ctx = createTestContext({ mode: 'interactive' });
      const result = constrain('Hello World', { maxWidth: 5.9, ctx });
      // 5.9 floors to 5 — clips to 5 columns
      expect(result).toBe('Hell…');
    });
  });
});
