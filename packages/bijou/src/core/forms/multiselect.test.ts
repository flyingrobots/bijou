import { describe, it, expect } from 'vitest';
import { multiselect } from './multiselect.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

describe('multiselect()', () => {
  describe('non-interactive fallback (static mode)', () => {
    it('renders numbered list', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,2'] } });
      await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('1.');
      expect(output).toContain('Red');
      expect(output).toContain('2.');
      expect(output).toContain('Green');
    });

    it('accepts comma-separated numbers', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,3'] } });
      const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      expect(result).toEqual(['red', 'blue']);
    });

    it('filters out invalid numbers', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1,99,2'] } });
      const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      expect(result).toEqual(['red', 'green']);
    });

    it('returns empty array when input is empty', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      expect(result).toEqual([]);
    });
  });

  describe('pipe mode', () => {
    it('accepts comma-separated numbers from stdin', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['2, 3'] } });
      const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      expect(result).toEqual(['green', 'blue']);
    });

    it('returns empty array when stdin is empty', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      expect(result).toEqual([]);
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter numbers separated by commas"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
      await multiselect({ title: 'Colors', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Enter numbers separated by commas');
    });
  });

  it('accepts ctx parameter', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1'] } });
    const result = await multiselect({ title: 'X', options: OPTIONS, ctx });
    expect(result).toEqual(['red']);
    expect(ctx.io.written.length).toBeGreaterThan(0);
  });

  it('single selection works', async () => {
    const ctx = createTestContext({ mode: 'static', io: { answers: ['2'] } });
    const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
    expect(result).toEqual(['green']);
  });

  it('all selections work', async () => {
    const ctx = createTestContext({ mode: 'static', io: { answers: ['1,2,3'] } });
    const result = await multiselect({ title: 'Colors', options: OPTIONS, ctx });
    expect(result).toEqual(['red', 'green', 'blue']);
  });
});
