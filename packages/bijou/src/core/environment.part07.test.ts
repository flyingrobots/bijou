import { describe, it, expect } from 'vitest';
import { detectOutputMode } from './detect/tty.js';
import { mockRuntime } from '../adapters/test/runtime.js';

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
