import { describe, it, expect } from 'vitest';
import { confirm } from './confirm.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('confirm()', () => {
  describe('pipe mode', () => {
    it('accepts "y" and returns true', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('accepts "yes" and returns true', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['yes'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('accepts "Y" and returns true', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['Y'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('accepts "n" and returns false', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['n'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
    });

    it('accepts "no" and returns false', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['no'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
    });

    it('accepts "N" and returns false', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['N'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
    });

    it('empty input returns default (true)', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('empty input returns default (false) when defaultValue is false', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: [''] } });
      expect(await confirm({ title: 'Continue?', defaultValue: false, ctx })).toBe(false);
    });

    it('invalid input returns default', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['maybe'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('prompt contains Y/n hint', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
      await confirm({ title: 'Continue?', ctx });
      expect(ctx.io.written.join('')).toContain('Y/n');
    });

    it('prompt contains y/N hint when default is false', async () => {
      const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
      await confirm({ title: 'Continue?', defaultValue: false, ctx });
      expect(ctx.io.written.join('')).toContain('y/N');
    });
  });

  describe('accessible mode', () => {
    it('prompt says "Type yes or no"', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: ['yes'] } });
      await confirm({ title: 'Continue?', ctx });
      expect(ctx.io.written.join('')).toContain('Type yes or no');
    });

    it('indicates default in prompt', async () => {
      const ctx = createTestContext({ mode: 'accessible', io: { answers: [''] } });
      await confirm({ title: 'Continue?', defaultValue: false, ctx });
      expect(ctx.io.written.join('')).toContain('default: no');
    });
  });

  describe('rich mode (interactive)', () => {
    it('prompt contains styled title', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: ['y'] } });
      await confirm({ title: 'Continue?', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('Continue?');
      expect(output).toContain('[Y/n]');
    });

    it('y/n parsing works in interactive mode', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: ['n'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
    });
  });

  describe('NO_COLOR', () => {
    it('prompt uses bracket style without ANSI escapes', async () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['y'] } });
      await confirm({ title: 'Continue?', ctx });
      const output = ctx.io.written.join('');
      expect(output).toContain('[Y/n]');
      expect(output).not.toMatch(/\x1b\[/);
    });

    it('"y" returns true under noColor', async () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['y'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('"n" returns false under noColor', async () => {
      const ctx = createTestContext({ mode: 'interactive', noColor: true, io: { answers: ['n'] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(false);
    });
  });

  it('accepts ctx parameter and uses it over default', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
    const result = await confirm({ title: 'OK?', ctx });
    expect(result).toBe(true);
    expect(ctx.io.written.length).toBeGreaterThan(0);
  });

  describe('Ctrl+C / empty answer in interactive mode', () => {
    it('empty answer in interactive mode returns default (true)', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
      expect(await confirm({ title: 'Continue?', ctx })).toBe(true);
    });

    it('empty answer in interactive mode returns default (false) when defaultValue is false', async () => {
      const ctx = createTestContext({ mode: 'interactive', io: { answers: [''] } });
      expect(await confirm({ title: 'Continue?', defaultValue: false, ctx })).toBe(false);
    });
  });
});
