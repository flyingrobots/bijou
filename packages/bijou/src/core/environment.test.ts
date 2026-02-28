import { describe, it, expect } from 'vitest';
import { createTestContext } from '../adapters/test/index.js';
import { detectOutputMode } from './detect/tty.js';
import { mockRuntime } from '../adapters/test/runtime.js';
import { box, headerBox } from './components/box.js';
import { table } from './components/table.js';
import { progressBar } from './components/progress.js';
import { spinnerFrame } from './components/spinner.js';
import { select } from './forms/select.js';
import { confirm } from './forms/confirm.js';
import { input } from './forms/input.js';
import { multiselect } from './forms/multiselect.js';
import { gradientText } from './theme/gradient.js';
import { plainStyle } from '../adapters/test/style.js';
import { CYAN_MAGENTA } from './theme/presets.js';

describe('environment integration', () => {
  describe('NO_COLOR compliance', () => {
    it('theme.ink() returns undefined for all tokens', () => {
      const ctx = createTestContext({ noColor: true, mode: 'interactive' });
      expect(ctx.theme.ink(ctx.theme.theme.semantic.primary)).toBeUndefined();
      expect(ctx.theme.ink(ctx.theme.theme.status.success)).toBeUndefined();
    });

    it('gradientText() returns plain text', () => {
      const result = gradientText('hello', CYAN_MAGENTA.gradient.brand, {
        style: plainStyle(),
        noColor: true,
      });
      expect(result).toBe('hello');
    });

    it('box borders render without ANSI color codes', () => {
      const ctx = createTestContext({ noColor: true, mode: 'interactive' });
      const result = box('content', { ctx });
      expect(result).not.toMatch(/\x1b\[/);
      expect(result).toContain('content');
      expect(result).toContain('┌'); // unicode border still present
    });

    it('progress bar renders without ANSI color codes', () => {
      const ctx = createTestContext({ noColor: true, mode: 'interactive' });
      const result = progressBar(50, { ctx });
      expect(result).not.toMatch(/\x1b\[/);
      expect(result).toContain('50%');
    });

    it('table renders without ANSI color codes', () => {
      const ctx = createTestContext({ noColor: true, mode: 'interactive' });
      const result = table({
        columns: [{ header: 'Name' }],
        rows: [['Alice']],
        ctx,
      });
      expect(result).not.toMatch(/\x1b\[/);
      expect(result).toContain('Name');
      expect(result).toContain('Alice');
    });

    it('spinnerFrame renders without ANSI color codes', () => {
      const ctx = createTestContext({ noColor: true, mode: 'interactive' });
      const result = spinnerFrame(0, { ctx });
      expect(result).not.toMatch(/\x1b\[/);
    });
  });

  describe('detection logic', () => {
    it('TTY with no env overrides detects as interactive', () => {
      const rt = mockRuntime({ stdoutIsTTY: true });
      expect(detectOutputMode(rt)).toBe('interactive');
    });

    it('CI=true with TTY detects as static', () => {
      const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: true });
      expect(detectOutputMode(rt)).toBe('static');
    });

    it('CI=true without TTY detects as pipe', () => {
      const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: false });
      expect(detectOutputMode(rt)).toBe('pipe');
    });

    it('TERM=dumb detected as pipe mode', () => {
      const rt = mockRuntime({ env: { TERM: 'dumb' }, stdoutIsTTY: true });
      expect(detectOutputMode(rt)).toBe('pipe');
    });

    it('NO_COLOR set -> pipe mode regardless of TTY', () => {
      const rt = mockRuntime({ env: { NO_COLOR: '' }, stdoutIsTTY: true });
      expect(detectOutputMode(rt)).toBe('pipe');
    });

    it('BIJOU_ACCESSIBLE=1 takes priority over everything', () => {
      const rt = mockRuntime({
        env: { BIJOU_ACCESSIBLE: '1', NO_COLOR: '1', CI: 'true' },
        stdoutIsTTY: false,
      });
      expect(detectOutputMode(rt)).toBe('accessible');
    });
  });

  describe('conflicting env vars', () => {
    it('NO_COLOR + TTY still produces pipe mode', () => {
      const rt = mockRuntime({ env: { NO_COLOR: '1' }, stdoutIsTTY: true });
      expect(detectOutputMode(rt)).toBe('pipe');
    });

    it('BIJOU_ACCESSIBLE overrides NO_COLOR + TERM=dumb', () => {
      const rt = mockRuntime({
        env: { BIJOU_ACCESSIBLE: '1', NO_COLOR: '1', TERM: 'dumb' },
        stdoutIsTTY: false,
      });
      expect(detectOutputMode(rt)).toBe('accessible');
    });

    it('TERM=dumb overrides CI', () => {
      const rt = mockRuntime({
        env: { TERM: 'dumb', CI: 'true' },
        stdoutIsTTY: true,
      });
      expect(detectOutputMode(rt)).toBe('pipe');
    });
  });

  describe('piped / non-interactive output', () => {
    it('box() returns content only, no border chars', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = box('hello world', { ctx });
      expect(result).toBe('hello world');
      expect(result).not.toMatch(/[┌┐└┘│─]/);
    });

    it('headerBox() returns label + detail as plain text', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = headerBox('Status', { detail: 'All good', ctx });
      expect(result).toContain('Status');
      expect(result).toContain('All good');
      expect(result).not.toMatch(/[┌┐└┘│─]/);
    });

    it('table() outputs TSV format', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = table({
        columns: [{ header: 'Name' }, { header: 'Age' }],
        rows: [['Alice', '30'], ['Bob', '25']],
        ctx,
      });
      const lines = result.split('\n');
      expect(lines[0]).toBe('Name\tAge');
      expect(lines[1]).toBe('Alice\t30');
      expect(lines[2]).toBe('Bob\t25');
      expect(result).not.toMatch(/[┌┐└┘│─]/);
    });

    it('progressBar() outputs percentage text', () => {
      const ctx = createTestContext({ mode: 'pipe' });
      const result = progressBar(50, { ctx });
      expect(result).toBe('Progress: 50%');
    });

    it('select() renders numbered list in pipe mode', async () => {
      const ctx = createTestContext({
        mode: 'pipe',
        io: { answers: ['2'] },
      });
      const result = await select({
        title: 'Pick a color',
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Green', value: 'green' },
        ],
        ctx,
      });
      expect(result).toBe('green');
      expect(ctx.io.written.join('')).toContain('1.');
      expect(ctx.io.written.join('')).toContain('2.');
    });
  });

  describe('accessible mode', () => {
    it('box() returns content only', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = box('important info', { ctx });
      expect(result).toBe('important info');
      expect(result).not.toMatch(/[┌┐└┘│─]/);
    });

    it('table() uses row-label format', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = table({
        columns: [{ header: 'Name' }, { header: 'Age' }],
        rows: [['Alice', '30']],
        ctx,
      });
      expect(result).toContain('Row 1');
      expect(result).toContain('Name=Alice');
      expect(result).toContain('Age=30');
    });

    it('spinnerFrame() returns static text indicator', () => {
      const ctx = createTestContext({ mode: 'accessible' });
      const result = spinnerFrame(0, { label: 'Loading', ctx });
      expect(result).toBe('Loading. Please wait.');
    });
  });

  describe('TERM=dumb', () => {
    it('box output contains no ANSI codes', () => {
      const ctx = createTestContext({
        mode: 'pipe',
        runtime: { env: { TERM: 'dumb' } },
      });
      const result = box('test content', { ctx });
      expect(result).not.toMatch(/\x1b\[/);
      expect(result).toContain('test content');
    });
  });
});

describe('form fallback in pipe mode', () => {
  it('confirm() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['y'] } });
    const result = await confirm({ title: 'OK?', ctx });
    expect(result).toBe(true);
    const output = ctx.io.written.join('');
    expect(output).not.toMatch(/\x1b\[/);
  });

  it('input() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['hello'] } });
    const result = await input({ title: 'Name', ctx });
    expect(result).toBe('hello');
    const output = ctx.io.written.join('');
    expect(output).not.toMatch(/\x1b\[/);
  });

  it('multiselect() works in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', io: { answers: ['1,2'] } });
    const result = await multiselect({
      title: 'Pick',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' },
      ],
      ctx,
    });
    expect(result).toEqual(['a', 'b']);
  });
});

describe('form fallback in accessible mode', () => {
  it('confirm() uses text prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['yes'] } });
    const result = await confirm({ title: 'OK?', ctx });
    expect(result).toBe(true);
    const output = ctx.io.written.join('');
    expect(output).toContain('Type yes or no');
  });

  it('input() uses descriptive prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['val'] } });
    const result = await input({ title: 'Username', ctx });
    expect(result).toBe('val');
    const output = ctx.io.written.join('');
    expect(output).toContain('Enter username');
  });

  it('multiselect() uses number prompt in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible', io: { answers: ['1'] } });
    const result = await multiselect({
      title: 'Pick',
      options: [{ label: 'A', value: 'a' }],
      ctx,
    });
    expect(result).toEqual(['a']);
    const output = ctx.io.written.join('');
    expect(output).toContain('Enter numbers separated by commas');
  });
});

describe('component × mode matrix', () => {
  const modes = ['interactive', 'pipe', 'accessible'] as const;

  for (const mode of modes) {
    describe(`mode: ${mode}`, () => {
      it('box() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = box('test', { ctx });
        expect(typeof result).toBe('string');
        expect(result).toContain('test');
      });

      it('table() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = table({
          columns: [{ header: 'Col' }],
          rows: [['val']],
          ctx,
        });
        expect(typeof result).toBe('string');
      });

      it('progressBar() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = progressBar(50, { ctx });
        expect(typeof result).toBe('string');
      });

      it('spinnerFrame() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = spinnerFrame(0, { ctx });
        expect(typeof result).toBe('string');
      });
    });
  }
});

describe('NO_COLOR × component matrix', () => {
  it('box() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = box('test', { ctx });
    expect(result).not.toMatch(/\x1b\[/);
  });

  it('headerBox() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = headerBox('Title', { detail: 'Info', ctx });
    expect(result).not.toMatch(/\x1b\[/);
  });

  it('progressBar() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = progressBar(75, { ctx });
    expect(result).not.toMatch(/\x1b\[/);
  });
});

describe('CI=true with TTY detection', () => {
  it('CI=true + TTY = static mode (not interactive)', () => {
    const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('static');
  });

  it('CI=true + no TTY = pipe mode', () => {
    const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: false });
    expect(detectOutputMode(rt)).toBe('pipe');
  });

  it('CI=1 variant works', () => {
    const rt = mockRuntime({ env: { CI: '1' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('static');
  });
});
