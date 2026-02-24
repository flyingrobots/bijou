import { describe, it, expect } from 'vitest';
import { createTestContext } from '../adapters/test/index.js';
import { detectOutputMode } from './detect/tty.js';
import { mockRuntime } from '../adapters/test/runtime.js';
import { box, headerBox } from './components/box.js';
import { table } from './components/table.js';
import { progressBar } from './components/progress.js';
import { spinnerFrame } from './components/spinner.js';
import { gradientText } from './theme/gradient.js';
import { plainStyle } from '../adapters/test/style.js';
import { CYAN_MAGENTA } from './theme/presets.js';

// ── NO_COLOR compliance ──────────────────────────────────────────────

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
});

// ── Piped / non-interactive output ───────────────────────────────────

describe('piped / non-interactive output', () => {
  it('box() returns content only (no border)', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = box('just text', { ctx });
    expect(result).toBe('just text');
  });

  it('headerBox() returns label + detail as plain text', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = headerBox('Deploy', { detail: 'v1.0', ctx });
    expect(result).toBe('Deploy  v1.0');
  });

  it('headerBox() returns label only when no detail', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = headerBox('Deploy', { ctx });
    expect(result).toBe('Deploy');
  });

  it('table() outputs TSV format', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = table({
      columns: [{ header: 'Name' }, { header: 'Age' }],
      rows: [['Alice', '30'], ['Bob', '25']],
      ctx,
    });
    expect(result).toBe('Name\tAge\nAlice\t30\nBob\t25');
  });

  it('progressBar() outputs percentage text', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(progressBar(45, { ctx })).toBe('Progress: 45%');
  });

  it('spinnerFrame() returns label with ellipsis', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(spinnerFrame(0, { ctx })).toBe('Loading...');
  });
});

// ── Detection logic ──────────────────────────────────────────────────

describe('CI detection', () => {
  it('CI=true with TTY detects as static', () => {
    const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('static');
  });

  it('CI=true without TTY detects as pipe', () => {
    const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: false });
    expect(detectOutputMode(rt)).toBe('pipe');
  });
});

describe('TERM=dumb', () => {
  it('detected as pipe mode', () => {
    const rt = mockRuntime({ env: { TERM: 'dumb' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('pipe');
  });
});

describe('NO_COLOR detection', () => {
  it('NO_COLOR set → pipe mode regardless of TTY', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('pipe');
  });
});

describe('BIJOU_ACCESSIBLE', () => {
  it('BIJOU_ACCESSIBLE=1 takes priority over everything', () => {
    const rt = mockRuntime({
      env: { BIJOU_ACCESSIBLE: '1', NO_COLOR: '1', CI: 'true' },
      stdoutIsTTY: false,
    });
    expect(detectOutputMode(rt)).toBe('accessible');
  });
});

// ── Accessible mode ──────────────────────────────────────────────────

describe('accessible mode', () => {
  it('box() returns content only', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(box('text', { ctx })).toBe('text');
  });

  it('headerBox() returns label: detail', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(headerBox('Status', { detail: 'OK', ctx })).toBe('Status: OK');
  });

  it('table() uses row-label format', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = table({
      columns: [{ header: 'Name' }, { header: 'Role' }],
      rows: [['Alice', 'Admin']],
      ctx,
    });
    expect(result).toBe('Row 1: Name=Alice, Role=Admin');
  });

  it('spinnerFrame() returns static text indicator', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(spinnerFrame(0, { ctx })).toBe('Loading. Please wait.');
  });

  it('progressBar() returns spoken percentage', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(progressBar(75, { ctx })).toBe('75 percent complete.');
  });
});

// ── Conflicting env vars ─────────────────────────────────────────────

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
