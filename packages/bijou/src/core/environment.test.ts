import { describe, it, expect } from 'vitest';
import { createTestContext } from '../adapters/test/index.js';
import { detectOutputMode } from './detect/tty.js';
import { mockRuntime } from '../adapters/test/runtime.js';
import { box } from './components/box.js';
import { table } from './components/table.js';
import { progressBar } from './components/progress.js';
import { spinnerFrame } from './components/spinner.js';
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
});
