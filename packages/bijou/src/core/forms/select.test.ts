import { describe, it, expect } from 'vitest';
import { select } from './select.js';
import { createTestContext } from '../../adapters/test/index.js';

const OPTIONS = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

describe('select()', () => {
  describe('numbered fallback (non-interactive)', () => {
    it('renders numbered list', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1'] } });
      await select({ title: 'Color', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('1.');
      expect(output).toContain('Red');
      expect(output).toContain('2.');
      expect(output).toContain('Green');
      expect(output).toContain('3.');
      expect(output).toContain('Blue');
    });

    it('accepts number and returns corresponding value', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['2'] } });
      const result = await select({ title: 'Color', options: OPTIONS, ctx });
      expect(result).toBe('green');
    });

    it('invalid number returns default or first option', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['99'] } });
      const result = await select({ title: 'Color', options: OPTIONS, ctx });
      expect(result).toBe('red'); // falls back to first
    });

    it('returns defaultValue when invalid input and default is set', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: [''] } });
      const result = await select({ title: 'Color', options: OPTIONS, defaultValue: 'blue', ctx });
      expect(result).toBe('blue');
    });

    it('valid input overrides defaultValue', async () => {
      const ctx = createTestContext({ mode: 'static', io: { answers: ['1'] } });
      const result = await select({ title: 'Color', options: OPTIONS, defaultValue: 'blue', ctx });
      expect(result).toBe('red');
    });
  });

  describe('pipe mode', () => {
    it('accepts number from stdin', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['3'] } });
      const result = await select({ title: 'Color', options: OPTIONS, ctx });
      expect(result).toBe('blue');
    });

    it('returns first option when stdin is empty', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      const result = await select({ title: 'Color', options: OPTIONS, ctx });
      expect(result).toBe('red');
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Enter number:"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
      await select({ title: 'Color', options: OPTIONS, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Enter number:');
    });

    it('shows option descriptions', async () => {
      const opts = [
        { label: 'Red', value: 'red', description: 'Warm color' },
        { label: 'Blue', value: 'blue', description: 'Cool color' },
      ];
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
      await select({ title: 'Color', options: opts, ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Warm color');
    });
  });

  it('accepts ctx parameter', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1'] } });
    const result = await select({ title: 'X', options: OPTIONS, ctx });
    expect(result).toBe('red');
    expect(ctx.io.written.length).toBeGreaterThan(0);
  });
});
