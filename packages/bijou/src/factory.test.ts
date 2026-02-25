import { describe, it, expect } from 'vitest';
import { createBijou } from './factory.js';
import { mockRuntime } from './adapters/test/runtime.js';
import { mockIO } from './adapters/test/io.js';
import { plainStyle } from './adapters/test/style.js';
import { CYAN_MAGENTA, TEAL_ORANGE_PINK } from './core/theme/presets.js';
import { toDTCG } from './core/theme/dtcg.js';

function basePorts(env: Record<string, string> = {}, tty = true) {
  return {
    runtime: mockRuntime({ env, stdoutIsTTY: tty }),
    io: mockIO(),
    style: plainStyle(),
  };
}

describe('createBijou()', () => {
  it('loads theme from .json path in BIJOU_THEME', () => {
    const custom = { ...TEAL_ORANGE_PINK, name: 'json-theme' };
    const ports = basePorts({ BIJOU_THEME: 'theme.json' });
    const mock = ports.io as ReturnType<typeof mockIO>;
    mock.files['theme.json'] = JSON.stringify(toDTCG(custom));

    const ctx = createBijou(ports);
    expect(ctx.theme.theme.name).toBe('json-theme');
    expect(ctx.theme.theme.status.success.hex).toBe(custom.status.success.hex);
  });

  it('falls back when .json path load fails', () => {
    const ports = basePorts({ BIJOU_THEME: 'missing.json' });
    const ctx = createBijou(ports);
    expect(ctx.theme.theme).toBe(CYAN_MAGENTA);
  });

  it('returns BijouContext with all five fields populated', () => {
    const ports = basePorts();
    const ctx = createBijou(ports);
    expect(ctx.runtime).toBe(ports.runtime);
    expect(ctx.io).toBe(ports.io);
    expect(ctx.style).toBe(ports.style);
    expect(ctx.mode).toBe('interactive');
    expect(ctx.theme.theme).toBe(CYAN_MAGENTA);
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

  it('detects static mode when CI is set with TTY', () => {
    const ctx = createBijou(basePorts({ CI: 'true' }, true));
    expect(ctx.mode).toBe('static');
  });

  it('detects accessible mode when BIJOU_ACCESSIBLE is set', () => {
    const ctx = createBijou(basePorts({ BIJOU_ACCESSIBLE: '1' }, true));
    expect(ctx.mode).toBe('accessible');
  });

  it('uses custom fallback theme when BIJOU_THEME is unrecognized', () => {
    const custom = { ...CYAN_MAGENTA, name: 'my-fallback' };
    const ctx = createBijou({
      ...basePorts({ BIJOU_THEME: 'nonexistent' }),
      theme: custom,
    });
    expect(ctx.theme.theme).toBe(custom);
  });
});
