import { describe, it, expect } from 'vitest';
import { filter } from './filter.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple', keywords: ['fruit', 'red'] },
  { label: 'Banana', value: 'banana', keywords: ['fruit', 'yellow'] },
  { label: 'Carrot', value: 'carrot', keywords: ['vegetable', 'orange'] },
];

describe('filter()', () => {
  describe('interactive mode', () => {
      it('renders list with cursor', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('❯');
        expect(output).toContain('Apple');
        expect(output).toContain('Banana');
        expect(output).toContain('Carrot');
      });

      it('Enter selects first item by default', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });

      it('arrow down + Enter selects second item', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[B', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('banana');
      });

      it('arrow up wraps to last item', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[A', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('carrot');
      });

      it('typing filters options', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['c', 'a', 'r', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('carrot');
      });

      it('typing narrows list then Enter selects', async () => {
        // Type "ban" — only Banana matches — Enter selects it
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['b', 'a', 'n', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('banana');
      });

      it('backspace removes filter character', async () => {
        // Type "cx" (matches nothing), backspace "c" (matches Carrot), Enter
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['c', 'x', '\x7f', '\r'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        // After backspace: query="c", Carrot matches
        expect(result).toBe('carrot');
      });

      it('Ctrl+C cancels and returns default/first value', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x03'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });

      it('Ctrl+C returns defaultValue when set', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x03'] } });
        const result = await filter({ title: 'Food', options: OPTIONS, defaultValue: 'banana', ctx });
        expect(result).toBe('banana');
      });

      it('shows item count status', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('3/3 items');
      });

      it('filter updates item count', async () => {
        // 'c' matches only Carrot, proving filtering actually occurred
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['c', '\r'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('1/3 items');
      });

      it('custom match function is used', async () => {
        const ctx = createTestContext({
          mode: 'interactive',
          io: { keys: ['x', '\r'] },
        });
        const result = await filter({
          title: 'Food',
          options: OPTIONS,
          match: (_query, opt) => opt.label === 'Banana',
          ctx,
        });
        expect(result).toBe('banana');
      });

      it('no matches returns default/first on Enter', async () => {
        const ctx = createTestContext({
          mode: 'interactive',
          io: { keys: ['z', 'z', 'z', '\r'] },
        });
        const result = await filter({ title: 'Food', options: OPTIONS, ctx });
        expect(result).toBe('apple');
      });
    });
});
