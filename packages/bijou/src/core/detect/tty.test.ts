import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectOutputMode, detectColorScheme } from './tty.js';
import { mockRuntime } from '../../adapters/test/runtime.js';

describe('detectOutputMode', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    delete process.env['BIJOU_ACCESSIBLE'];
    delete process.env['NO_COLOR'];
    delete process.env['CI'];
    delete process.env['TERM'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
  });

  it('returns accessible when BIJOU_ACCESSIBLE=1', () => {
    process.env['BIJOU_ACCESSIBLE'] = '1';
    expect(detectOutputMode()).toBe('accessible');
  });

  it('returns pipe when NO_COLOR is set', () => {
    process.env['NO_COLOR'] = '1';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(detectOutputMode()).toBe('pipe');
  });

  it('returns pipe when TERM=dumb', () => {
    process.env['TERM'] = 'dumb';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(detectOutputMode()).toBe('pipe');
  });

  it('returns pipe when stdout is not a TTY', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(detectOutputMode()).toBe('pipe');
  });

  it('returns static when CI is set', () => {
    process.env['CI'] = 'true';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(detectOutputMode()).toBe('static');
  });

  it('returns interactive when stdout is TTY and no overrides', () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(detectOutputMode()).toBe('interactive');
  });

  it('BIJOU_ACCESSIBLE takes priority over NO_COLOR', () => {
    process.env['BIJOU_ACCESSIBLE'] = '1';
    process.env['NO_COLOR'] = '1';
    expect(detectOutputMode()).toBe('accessible');
  });

  it('NO_COLOR takes priority over CI', () => {
    process.env['NO_COLOR'] = '1';
    process.env['CI'] = 'true';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(detectOutputMode()).toBe('pipe');
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
