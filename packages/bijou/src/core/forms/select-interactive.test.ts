import { describe, expect, it } from 'vitest';
import { createTestContext, COLOR_OPTIONS, MANY_OPTIONS } from '../../adapters/test/index.js';
import { select } from './select.js';

describe('select() interactive mode', () => {
  it('renders list with cursor on first item', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\r'] } });
    await select({ title: 'Color', options: COLOR_OPTIONS, ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('❯');
    expect(output).toContain('Red');
    expect(output).toContain('Green');
    expect(output).toContain('Blue');
  });

  it('down arrow + Enter selects second option', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[B', '\r'] } });
    const result = await select({ title: 'Color', options: COLOR_OPTIONS, ctx });
    expect(result).toBe('green');
  });

  it('up arrow wraps to last item', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b[A', '\r'] } });
    const result = await select({ title: 'Color', options: COLOR_OPTIONS, ctx });
    expect(result).toBe('blue');
  });

  it('Ctrl+C returns default/first value', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x03'] } });
    const result = await select({ title: 'Color', options: COLOR_OPTIONS, ctx });
    expect(result).toBe('red');
  });

  it('Escape returns default/first value', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b'] } });
    const result = await select({ title: 'Color', options: COLOR_OPTIONS, ctx });
    expect(result).toBe('red');
  });

  it('Escape returns defaultValue when set', async () => {
    const ctx = createTestContext({ mode: 'interactive', io: { keys: ['\x1b'] } });
    const result = await select({ title: 'Color', options: COLOR_OPTIONS, defaultValue: 'blue', ctx });
    expect(result).toBe('blue');
  });

  it('supports maxVisible scrolling for long option lists', async () => {
    const ctx = createTestContext({
      mode: 'interactive',
      io: { keys: ['\x1b[B', '\x1b[B', '\x1b[B', '\x1b[B', '\r'] },
    });
    const result = await select({
      title: 'Pick',
      options: MANY_OPTIONS,
      maxVisible: 3,
      ctx,
    });
    const output = ctx.io.written.join('');

    expect(result).toBe('v5');
    expect(output).toContain('\x1b[4A');
    expect(output).not.toContain('\x1b[11A');
    expect(output).toContain('Option 5');
    expect(output).not.toContain('Option 10');
  });

  it('sanitizes non-finite maxVisible values', async () => {
    const ctx = createTestContext({
      mode: 'interactive',
      io: { keys: ['\x1b[B', '\x1b[B', '\r'] },
    });
    const result = await select({
      title: 'Pick',
      options: MANY_OPTIONS,
      maxVisible: Number.NaN,
      ctx,
    });

    expect(result).toBe('v3');
    expect(ctx.io.written.join('')).not.toContain('[NaN');
  });
});
