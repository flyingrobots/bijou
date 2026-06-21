import { describe, it, expect } from 'vitest';
import { filter } from './filter.js';
import { createTestContext, MANY_OPTIONS } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple', keywords: ['fruit', 'red'] },
  { label: 'Banana', value: 'banana', keywords: ['fruit', 'yellow'] },
  { label: 'Carrot', value: 'carrot', keywords: ['vegetable', 'orange'] },
];

describe('filter()', () => {
  describe('viewport scrolling', () => {
      it('cursor past maxVisible still shows cursor indicator', async () => {
        // maxVisible=3. Navigate down 8 times → cursor at index 8 = A9.
        // The viewport must scroll so A9 is visible WITH the cursor indicator.
        const keys = Array.from({ length: 8 }, () => '\x1b[B').concat(['\r']);
        const ctx = createTestContext({ mode: 'interactive', io: { keys } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
        expect(result).toBe('v9');
        const output = ctx.io.written.join('');
        expect(output).toMatch(/❯.*Option 9/);
      });

      it('cursor wraps up past maxVisible and is visible', async () => {
        // Navigate up from index 0 wraps to last (Option 20, index 19).
        // Viewport must scroll to show Option 20 with cursor indicator.
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[A', '\r'] } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
        expect(result).toBe('v20');
        const output = ctx.io.written.join('');
        expect(output).toMatch(/❯.*Option 20/);
      });

      it('scroll down then back up tracks correctly', async () => {
        // Navigate down 4 times (past maxVisible=3), then up 2 times, Enter
        const keys = ['\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '\x1b[A', '\x1b[A', '\r'];
        const ctx = createTestContext({ mode: 'interactive', io: { keys } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
        expect(result).toBe('v3');
      });

      it('filter query resets scroll offset', async () => {
        // Navigate down 5, then type query that narrows list to 1 match
        const keys = ['\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '1', '0', '\r'];
        const ctx = createTestContext({ mode: 'interactive', io: { keys } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
        // "10" matches Option 10
        expect(result).toBe('v10');
      });

      it('maxVisible=1 shows single item with cursor', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[B', '\r'] } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 1, ctx });
        expect(result).toBe('v2');
      });

      it('maxVisible >= option count needs no scrolling', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[B', '\r'] } });
        const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 20, ctx });
        expect(result).toBe('v2');
      });

      it('sanitizes non-finite maxVisible values', async () => {
        const ctx = createTestContext({
          mode: 'interactive',
          io: { keys: ['j', 'j', '\r'] },
        });
        const result = await filter({
          title: 'Pick',
          options: MANY_OPTIONS,
          maxVisible: Number.NaN,
          ctx,
        });

        expect(result).toBe('v3');
        expect(ctx.io.written.join('')).not.toContain('NaN');
      });
    });

  describe('no-matches status', () => {
      it('shows 0/3 items when no options match', async () => {
        const ctx = createTestContext({
          mode: 'interactive',
          io: { keys: ['z', 'z', 'z', '\r'] },
        });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('0/3 items');
      });
    });

  describe('out-of-range number input (non-interactive)', () => {
      it('returns first option for number 0', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['0'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });

      it('returns first option for negative number', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['-1'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });

      it('returns first option for number exceeding option count', async () => {
        const ctx = createTestContext({ mode: 'static', io: { answers: ['99'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });
    });

  describe('test deduplication', () => {
      it('printable char in normal mode enters insert + types char (distinct from insert-mode typing)', async () => {
        // This test focuses on the mode transition: 'c' should switch from normal to insert
        // AND type 'c' as filter text. Distinct from typing 'c' when already in insert mode.
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['c', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        // Only Carrot matches 'c'
        expect(result).toBe('carrot');
        const output = ctx.io.written.join('');
        // After typing 'c', mode should show '/' (insert mode indicator)
        expect(output).toContain('  / ');
      });
    });
});
