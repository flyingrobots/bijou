import { describe, it, expect } from 'vitest';
import { multiselect } from './multiselect.js';
import { createTestContext, COLOR_OPTIONS, MANY_OPTIONS } from '../../adapters/test/index.js';

describe('multiselect()', () => {
  it('returns empty array when options list is empty', async () => {
    const result = await multiselect({ title: 'Empty', options: [] });
    expect(result).toEqual([]);
  });

  describe('numbered fallback (non-interactive)', () => {
    it('renders numbered list', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,2'] } });
      await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('1.');
      expect(output).toContain('Red');
      expect(output).toContain('2.');
      expect(output).toContain('Green');
    });

    it('accepts comma-separated numbers', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,3'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red', 'blue']);
    });

    it('filters out invalid numbers', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,99,2'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red', 'green']);
    });

    it('returns empty array when input is empty', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual([]);
    });
  });

  describe('pipe mode', () => {
    it('accepts comma-separated numbers from stdin', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['2, 3'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['green', 'blue']);
    });

    it('returns empty array when stdin is empty', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual([]);
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter numbers separated by commas"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Enter numbers separated by commas');
      expect(result).toEqual(['red']);
    });
  });

  describe('interactive mode', () => {
    it('renders with checkboxes', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
      await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('○');
      expect(output).toContain('Red');
      expect(output).toContain('Green');
      expect(output).toContain('Blue');
    });

    it('Space toggles first, Enter confirms', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: [' ', '\r'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red']);
    });

    it('navigate + toggle multiple items', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: [' ', '\x1b[B', ' ', '\r'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['red', 'green']);
    });

    it('Ctrl+C returns empty array', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x03'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual([]);
    });

    it('Escape returns empty array', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual([]);
    });

    it('toggle on and off deselects item', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: [' ', ' ', '\r'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual([]);
    });

    it('navigate to last item and select', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[B', '\x1b[B', ' ', '\r'] } });
      const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
      expect(result).toEqual(['blue']);
    });

    it('supports maxVisible scrolling for long option lists', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: ['\x1b[B', '\x1b[B', '\x1b[B', ' ', '\r'] },
      });
      const result = await multiselect({
        title: 'Pick',
        options: MANY_OPTIONS,
        maxVisible: 3,
        ctx,
      });
      const output = ctx.io.written.join('');

      expect(result).toEqual(['v4']);
      expect(output).toContain('\x1b[4A');
      expect(output).toContain('Option 4');
      expect(output).not.toContain('Option 10');
    });

    it('sanitizes non-finite maxVisible values', async () => {
      const ctx = createTestContext({
        mode: 'interactive',
        io: { keys: [' ', '\r'] },
      });
      const result = await multiselect({
        title: 'Pick',
        options: MANY_OPTIONS,
        maxVisible: Number.NaN,
        ctx,
      });

      expect(result).toEqual(['v1']);
      expect(ctx.io.written.join('')).not.toContain('[NaN');
    });
  });

  it('accepts ctx parameter', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1'] } });
    const result = await multiselect({ title: 'X', options: COLOR_OPTIONS, ctx });
    expect(result).toEqual(['red']);
    expect(ctx.io.written.length).toBeGreaterThan(0);
  });

  it('single selection works', async () => {
    const ctx = createTestContext({ mode: 'static', io: { answers: ['2'] } });
    const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
    expect(result).toEqual(['green']);
  });

  it('all selections work', async () => {
    const ctx = createTestContext({ mode: 'static', io: { answers: ['1,2,3'] } });
    const result = await multiselect({ title: 'Colors', options: COLOR_OPTIONS, ctx });
    expect(result).toEqual(['red', 'green', 'blue']);
  });
});
