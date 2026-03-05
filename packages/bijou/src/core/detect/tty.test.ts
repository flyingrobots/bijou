import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectOutputMode, detectColorScheme } from './tty.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('detectOutputMode', () => {
  it('returns accessible when BIJOU_ACCESSIBLE=1', () => {
    const rt = mockRuntime({ env: { BIJOU_ACCESSIBLE: '1' }, stdoutIsTTY: true });
    expect(detectOutputMode(rt)).toBe('accessible');
  });

  it('returns pipe when NO_COLOR is set', () => {
    const rt = mockRuntime({ env: { NO_COLOR: '1' }, stdoutIsTTY: true });
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

  it('BIJOU_ACCESSIBLE takes priority over NO_COLOR', () => {
    const rt = mockRuntime({
      env: { BIJOU_ACCESSIBLE: '1', NO_COLOR: '1' },
      stdoutIsTTY: true,
    });
    expect(detectOutputMode(rt)).toBe('accessible');
  });

  it('NO_COLOR takes priority over CI', () => {
    const rt = mockRuntime({
      env: { NO_COLOR: '1', CI: 'true' },
      stdoutIsTTY: true,
    });
    expect(detectOutputMode(rt)).toBe('pipe');
  });
});

describe('detectColorScheme', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env['COLORFGBG'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns dark when COLORFGBG is not set', () => {
    expect(detectColorScheme()).toBe('dark');
  });

  it('returns dark when bg is 0 (COLORFGBG=15;0)', () => {
    process.env['COLORFGBG'] = '15;0';
    expect(detectColorScheme()).toBe('dark');
  });

  it('returns light when bg is 15 (COLORFGBG=0;15)', () => {
    process.env['COLORFGBG'] = '0;15';
    expect(detectColorScheme()).toBe('light');
  });

  it('uses last segment for 3-part format (COLORFGBG=default;0;15)', () => {
    process.env['COLORFGBG'] = 'default;0;15';
    expect(detectColorScheme()).toBe('light');
  });

  it('returns dark for garbage value', () => {
    process.env['COLORFGBG'] = 'garbage';
    expect(detectColorScheme()).toBe('dark');
  });

  it('returns dark for empty string', () => {
    process.env['COLORFGBG'] = '';
    expect(detectColorScheme()).toBe('dark');
  });

  it('returns dark for bg=6 (boundary)', () => {
    process.env['COLORFGBG'] = '15;6';
    expect(detectColorScheme()).toBe('dark');
  });

  it('returns light for bg=7 (boundary)', () => {
    process.env['COLORFGBG'] = '15;7';
    expect(detectColorScheme()).toBe('light');
  });

  it('reads COLORFGBG via RuntimePort', () => {
    const rt = mockRuntime({ env: { COLORFGBG: '0;15' } });
    expect(detectColorScheme(rt)).toBe('light');
  });

  it('returns dark via RuntimePort when COLORFGBG is absent', () => {
    const rt = mockRuntime({});
    expect(detectColorScheme(rt)).toBe('dark');
  });
});
