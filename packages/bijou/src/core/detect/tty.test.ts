import { describe, it, expect } from 'vitest';
import { detectOutputMode, detectColorScheme } from './tty.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('detectOutputMode', () => {
  it('returns accessible when BIJOU_ACCESSIBLE=1', () => {
    const rt = mockRuntime({ env: { BIJOU_ACCESSIBLE: '1' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('accessible');
  });

  // NO_COLOR is a statement about colour, not about capability. It must not
  // downgrade a real terminal out of interactive mode; colour suppression happens
  // on the theme/style path, which never consults `mode`.
  it('leaves an interactive session interactive when NO_COLOR is set', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '1' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('interactive');
  });

  it('returns pipe when NO_COLOR is set and stdout is not a TTY', () => {
    // pipe because of the TTY, not because of NO_COLOR.
    const rt = mockRuntime({ env: { NO_COLOR: '1' }, stdoutIsTTY: false });
    expect(detectOutputMode(rt)).toBe('pipe');
  });

  it('returns pipe when NO_COLOR is combined with TERM=dumb', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '1', TERM: 'dumb' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('pipe');
  });

  it('returns pipe when TERM=dumb', () => {
    const rt = mockRuntime({ env: { TERM: 'dumb' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('pipe');
  });

  it('returns pipe when stdout is not a TTY', () => {
    const rt = mockRuntime({ stdoutIsTTY: false });
    expect(detectOutputMode(rt)).toBe('pipe');
  });

  it('returns static when CI is set', () => {
    const rt = mockRuntime({ env: { CI: 'true' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('static');
  });

  it('returns interactive when stdout is TTY and no overrides', () => {
    const rt = mockRuntime({ stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('interactive');
  });

  it('BIJOU_ACCESSIBLE takes priority over an interactive TTY', () => {
    const rt = mockRuntime({
      env: { BIJOU_ACCESSIBLE: '1', NO_COLOR: '1' },
      stdoutIsTTY: true,
    });
    expect(detectOutputMode(rt)).toBe('accessible');
  });

  it('CI still decides when NO_COLOR is also set', () => {
    // Previously NO_COLOR short-circuited to pipe before CI was ever consulted.
    const rt = mockRuntime({
      env: { NO_COLOR: '1', CI: 'true' },
      stdoutIsTTY: true,
    });
    expect(detectOutputMode(rt)).toBe('static');
  });
});

describe('detectColorScheme', () => {
  it('returns dark when COLORFGBG is not set', () => {
    const rt = mockRuntime({});
    expect(detectColorScheme(rt)).toBe('dark');
  });

  it('returns dark when bg is 0 (COLORFGBG=15;0)', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '15;0' } });
    expect(detectColorScheme(rt)).toBe('dark');
  });

  it('returns light when bg is 15 (COLORFGBG=0;15)', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '0;15' } });
    expect(detectColorScheme(rt)).toBe('light');
  });

  it('uses last segment for 3-part format (COLORFGBG=default;0;15)', () => {
    const rt = mockRuntime({ env: { COLORFGBG: 'default;0;15' } });
    expect(detectColorScheme(rt)).toBe('light');
  });

  it('returns dark for garbage value', () => {
    const rt = mockRuntime({ env: { COLORFGBG: 'garbage' } });
    expect(detectColorScheme(rt)).toBe('dark');
  });

  it('returns dark for empty string', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '' } });
    expect(detectColorScheme(rt)).toBe('dark');
  });

  it('returns dark for bg=6 (boundary)', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '15;6' } });
    expect(detectColorScheme(rt)).toBe('dark');
  });

  it('returns light for bg=7 (boundary)', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '15;7' } });
    expect(detectColorScheme(rt)).toBe('light');
  });
});
