import { describe, it, expect } from 'vitest';
import { createBijou } from './factory.js';
import { mockRuntime } from './adapters/test/runtime.js';
import { mockIO } from './adapters/test/io.js';
import { plainStyle } from './adapters/test/style.js';
import { CYAN_MAGENTA, TEAL_ORANGE_PINK } from './core/theme/presets.js';

function basePorts(env: Record<string, string> = {}, tty = true) {
  return {
    runtime: mockRuntime({ env, stdoutIsTTY: tty }),
    io: mockIO(),
    style: plainStyle(),
  };
}

describe('createBijou()', () => {
  it('returns BijouContext with all five fields populated', () => {
    const ctx = createBijou(basePorts());
    expect(ctx.theme).toBeDefined();
    expect(ctx.mode).toBeDefined();
    expect(ctx.runtime).toBeDefined();
    expect(ctx.io).toBeDefined();
    expect(ctx.style).toBeDefined();
  });

  it('reads BIJOU_THEME from runtime.env and resolves matching preset', () => {
    const ctx = createBijou(basePorts({ BIJOU_THEME: 'teal-orange-pink' }));
    expect(ctx.theme.theme).toBe(TEAL_ORANGE_PINK);
  });

  it('falls back to CYAN_MAGENTA when BIJOU_THEME is unrecognized', () => {
    const ctx = createBijou(basePorts({ BIJOU_THEME: 'nonexistent' }));
    expect(ctx.theme.theme).toBe(CYAN_MAGENTA);
  });

  it('uses custom envVar when provided', () => {
    const ctx = createBijou({
      ...basePorts({ MY_THEME: 'teal-orange-pink' }),
      envVar: 'MY_THEME',
    });
    expect(ctx.theme.theme).toBe(TEAL_ORANGE_PINK);
  });

  it('uses custom presets registry when provided', () => {
    const custom = { ...CYAN_MAGENTA, name: 'custom' };
    const ctx = createBijou({
      ...basePorts({ BIJOU_THEME: 'custom' }),
      presets: { custom },
    });
    expect(ctx.theme.theme).toBe(custom);
  });

  it('sets noColor: true when NO_COLOR is defined', () => {
    const ctx = createBijou(basePorts({ NO_COLOR: '1' }));
    expect(ctx.theme.noColor).toBe(true);
  });

  it('sets noColor: true when NO_COLOR is empty string', () => {
    const ctx = createBijou(basePorts({ NO_COLOR: '' }));
    expect(ctx.theme.noColor).toBe(true);
  });

  it('sets noColor: false when NO_COLOR is absent', () => {
    const ctx = createBijou(basePorts());
    expect(ctx.theme.noColor).toBe(false);
  });

  it('detects interactive mode when stdout is TTY', () => {
    const ctx = createBijou(basePorts({}, true));
    expect(ctx.mode).toBe('interactive');
  });

  it('detects pipe mode when stdout is not TTY', () => {
    const ctx = createBijou(basePorts({}, false));
    expect(ctx.mode).toBe('pipe');
  });

  it('defaults to CYAN_MAGENTA when no BIJOU_THEME env var is set', () => {
    const ctx = createBijou(basePorts());
    expect(ctx.theme.theme).toBe(CYAN_MAGENTA);
  });
});
