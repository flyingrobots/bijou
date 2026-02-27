import { describe, it, expect } from 'vitest';
import { filter } from './filter.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple', keywords: ['fruit', 'red'] },
  { label: 'Banana', value: 'banana', keywords: ['fruit', 'yellow'] },
  { label: 'Carrot', value: 'carrot', keywords: ['vegetable', 'orange'] },
];

describe('filter()', () => {
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
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['a', '\r'] } });
      await filter({ title: 'Food', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      // "a" matches Apple, Banana, Carrot (all contain 'a')
      // Check that status shows filtered count
      expect(output).toContain('/3 items');
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
