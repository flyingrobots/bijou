import { describe, it, expect } from 'vitest';
import { filter } from './filter.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple', keywords: ['fruit', 'red'] },
  { label: 'Banana', value: 'banana', keywords: ['fruit', 'yellow'] },
  { label: 'Carrot', value: 'carrot', keywords: ['vegetable', 'orange'] },
];

describe('filter()', () => {
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
        // In normal mode, prompt should show the ': ' pattern (indent + colon + space)
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
        await filter({ title: 'Food', options: OPTIONS, ctx });
        const output = ctx.io.written.join('');
        expect(output).toContain('  : ');
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
        // Add Kiwi option so 'k' matches it, proving k was typed as filter text
        const optionsWithKiwi = [...OPTIONS, { label: 'Kiwi', value: 'kiwi' }];
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['/', 'k', '\r'] } });
        const result = await filter({ title: 'Food', options: optionsWithKiwi, ctx });
        expect(result).toBe('kiwi');
      });
    });
});
