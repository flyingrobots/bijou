import { describe, it, expect } from 'vitest';
import { multiselect } from './multiselect.js';
import { createTestContext, COLOR_OPTIONS, MANY_OPTIONS } from '../../adapters/test/index.js';

describe('multiselect()', () => {
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

      it('pre-selected defaultValues render as checked on initial render', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
        const result = await multiselect({
          title: 'Colors',
          options: COLOR_OPTIONS,
          defaultValues: ['red', 'blue'],
          ctx,
        });
        const output = ctx.io.written.join('');
        // ◉ = filled circle = selected; should appear for red and blue
        expect(output).toContain('◉');
        expect(result).toEqual(['red', 'blue']);
      });

      it('cancel with defaultValues does not render preselected labels', async () => {
        const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x03'] } });
        const result = await multiselect({
          title: 'Colors',
          options: COLOR_OPTIONS,
          defaultValues: ['red', 'blue'],
          ctx,
        });
        expect(result).toEqual([]);
        // The cleanup line should NOT contain the preselected labels
        const lastWrites = ctx.io.written.slice(-3).join('');
        expect(lastWrites).not.toContain('Red, Blue');
      });

      it('defaultValues can be toggled off', async () => {
        // Space on first item (red, pre-selected) toggles it off, then Enter
        const ctx = createTestContext({ mode: 'interactive', io: { keys: [' ', '\r'] } });
        const result = await multiselect({
          title: 'Colors',
          options: COLOR_OPTIONS,
          defaultValues: ['red', 'blue'],
          ctx,
        });
        expect(result).toEqual(['blue']);
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

        expect(result).toEqual([MANY_OPTIONS[3]?.value]);
        expect(output).toContain('\x1b[4A');
        expect(output).toContain(MANY_OPTIONS[3]?.label);
        expect(output).not.toContain(MANY_OPTIONS[9]?.label);
      });

      it('wrap-around scrolling from first to last item', async () => {
        const ctx = createTestContext({
          mode: 'interactive',
          io: { keys: ['\x1b[A', ' ', '\r'] },
        });
        const result = await multiselect({
          title: 'Pick',
          options: MANY_OPTIONS,
          maxVisible: 3,
          ctx,
        });
        const output = ctx.io.written.join('');

        expect(result).toEqual([MANY_OPTIONS[MANY_OPTIONS.length - 1]?.value]);
        expect(output).toContain(MANY_OPTIONS[MANY_OPTIONS.length - 1]?.label);
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
});
