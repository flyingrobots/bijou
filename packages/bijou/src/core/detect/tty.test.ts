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

  it('falls back to process.stdout.isTTY when runtime is omitted', () => {
    const originalAccessible = process.env['BIJOU_ACCESSIBLE'];
    const originalNoColor = process.env['NO_COLOR'];
    const originalTerm = process.env['TERM'];
    const originalCi = process.env['CI'];
    const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: true });

    try {
      delete process.env['BIJOU_ACCESSIBLE'];
      delete process.env['NO_COLOR'];
      delete process.env['TERM'];
      delete process.env['CI'];
      expect(detectOutputMode()).toBe('interactive');
    } finally {
      if (ttyDescriptor == null) {
        delete (process.stdout as { isTTY?: boolean }).isTTY;
      } else {
        Object.defineProperty(process.stdout, 'isTTY', ttyDescriptor);
      }
      if (originalAccessible === undefined) delete process.env['BIJOU_ACCESSIBLE'];
      else process.env['BIJOU_ACCESSIBLE'] = originalAccessible;
      if (originalNoColor === undefined) delete process.env['NO_COLOR'];
      else process.env['NO_COLOR'] = originalNoColor;
      if (originalTerm === undefined) delete process.env['TERM'];
      else process.env['TERM'] = originalTerm;
      if (originalCi === undefined) delete process.env['CI'];
      else process.env['CI'] = originalCi;
    }
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
