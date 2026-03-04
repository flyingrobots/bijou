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
        defaultValue: 'fallback' as string,
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

  describe('vim-style mode switching', () => {
    it('starts in normal mode — j navigates down, not filter', async () => {
      // j + Enter: in normal mode j navigates down, selecting Banana
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['j', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('banana');
    });

    it('k navigates up in normal mode', async () => {
      // k wraps to last item (Carrot)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['k', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('carrot');
    });

    it('j navigates down in normal mode', async () => {
      // j, j goes to third item (Carrot)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['j', 'j', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('carrot');
    });

    it('/ enters insert mode — subsequent j types as filter char', async () => {
      // / enters insert mode, then j is typed as filter text, not navigation
      // No options match "j" so it returns default (apple)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', 'j', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('apple');
    });

    it('printable char in normal mode enters insert + types char', async () => {
      // 'c' enters insert mode and types 'c', matching Carrot
      // Then 'a', 'r' narrow further, Enter selects
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['c', 'a', 'r', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('carrot');
    });

    it('Escape in insert mode returns to normal mode', async () => {
      // / enters insert, type 'a', Escape back to normal, j navigates down, Enter selects
      // After Escape query is still 'a' — Apple, Banana match (both contain 'a')
      // j moves to second in filtered list (Banana)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', 'a', '\x1b', 'j', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('banana');
    });

    it('Escape in normal mode cancels', async () => {
      // Escape in normal mode cancels — returns default/first
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('apple');
    });

    it('arrow keys work in insert mode', async () => {
      // / enters insert, arrow down selects Banana, Enter
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', '\x1b[B', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('banana');
    });

    it('Ctrl+C cancels from either mode', async () => {
      // Enter insert mode with /, then Ctrl+C cancels
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', '\x03'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('apple');
    });

    it('mode indicator shows : in normal mode', async () => {
      // In normal mode, prompt should show ':'
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
      await filter({ title: 'Food', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain(':');
    });

    it('mode indicator shows / in insert mode', async () => {
      // After entering insert mode, prompt should show '/' (not just in x/y status)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', '\r'] } });
      await filter({ title: 'Food', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('  / ');
    });

    it('k is typeable in insert mode', async () => {
      // / enters insert mode; k is typed as query (not navigation)
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', 'k', '\r'] } });
      const result = await filter({ title: 'Food', options: OPTIONS, ctx });
      expect(result).toBe('apple');
    });
  });

  describe('viewport scrolling', () => {
    const MANY_OPTIONS = [
      { label: 'A1', value: 'a1' },
      { label: 'A2', value: 'a2' },
      { label: 'A3', value: 'a3' },
      { label: 'A4', value: 'a4' },
      { label: 'A5', value: 'a5' },
      { label: 'A6', value: 'a6' },
      { label: 'A7', value: 'a7' },
      { label: 'A8', value: 'a8' },
      { label: 'A9', value: 'a9' },
      { label: 'A10', value: 'a10' },
    ];

    it('cursor past maxVisible still shows cursor indicator', async () => {
      // maxVisible=3. Navigate down 8 times → cursor at index 8 = A9.
      // The viewport must scroll so A9 is visible WITH the cursor indicator.
      const keys = Array.from({ length: 8 }, () => '\x1b[B').concat(['\r']);
      const ctx = createTestContext({ mode: 'interactive', io: { keys } });
      const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
      expect(result).toBe('a9');
      // Strip ANSI codes and verify a line contains both ❯ and A9
      const stripped = ctx.io.written.join('').replace(/\x1b\[[0-9;]*m/g, '');
      expect(stripped).toMatch(/❯.*A9/);
    });

    it('cursor wraps up past maxVisible and is visible', async () => {
      // Navigate up from index 0 wraps to last (A10, index 9).
      // Viewport must scroll to show A10 with cursor indicator.
      const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[A', '\r'] } });
      const result = await filter({ title: 'Pick', options: MANY_OPTIONS, maxVisible: 3, ctx });
      expect(result).toBe('a10');
      const stripped = ctx.io.written.join('').replace(/\x1b\[[0-9;]*m/g, '');
      expect(stripped).toMatch(/❯.*A10/);
    });
  });
});
