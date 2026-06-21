import { describe, it, expect } from 'vitest';
import { filter } from './filter.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple', keywords: ['fruit', 'red'] },
  { label: 'Banana', value: 'banana', keywords: ['fruit', 'yellow'] },
  { label: 'Carrot', value: 'carrot', keywords: ['vegetable', 'orange'] },
];

describe('filter()', () => {
  describe('empty options guard', () => {
      it('throws when options is empty and no defaultValue', async () => {
        await expect(
          filter({ title: 'Pick', options: [], ctx: createTestContext({ mode: 'static', io: { answers: [''] } }) }),
        ).rejects.toThrow('at least one option');
      });

      it('returns defaultValue when options is empty', async () => {
        const result = await filter({
          title: 'Pick',
          options: [],
          defaultValue: 'fallback',
          ctx: createTestContext({ mode: 'static', io: { answers: [''] } }),
        });
        expect(result).toBe('fallback');
      });
    });

  describe('numbered fallback (non-interactive)', () => {
      it('renders numbered list', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['1'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('1.');
        expect(output).toContain('Apple');
        expect(output).toContain('2.');
        expect(output).toContain('Banana');
        expect(output).toContain('3.');
        expect(output).toContain('Carrot');
      });

      it('accepts number and returns corresponding value', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['2'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('banana');
      });

      it('matches by text when number is invalid', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['ban'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('banana');
      });

      it('matches by keyword', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['vegetable'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('carrot');
      });

      it('returns first option when no match', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['xyz'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });

      it('returns defaultValue when no match and default is set', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['xyz'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, defaultValue: 'carrot', ctx });
        expect(result).toBe('carrot');
      });

      it('empty input returns first option', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });
    });

  describe('pipe mode', () => {
      it('accepts number from stdin', async () => {
        const ctx = createTestContext({ mode: 'pipe', io: { answers: ['3'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('carrot');
      });

      it('accepts text from stdin', async () => {
        const ctx = createTestContext({ mode: 'pipe', io: { answers: ['apple'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });
    });

  describe('accessible mode', () => {
      it('prompt says "Enter number or search"', async () => {
        const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('Enter number or search');
      });
    });
});
