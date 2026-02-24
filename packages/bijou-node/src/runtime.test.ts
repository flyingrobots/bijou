import { describe, it, expect, afterEach, vi } from 'vitest';
import { nodeRuntime } from './runtime.js';

describe('nodeRuntime()', () => {
  const TEMP_KEY = '__BIJOU_TEST_RUNTIME__';

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('env() reads from process.env', () => {
    vi.stubEnv(TEMP_KEY, 'hello');
    const rt = nodeRuntime();
    expect(rt.env(TEMP_KEY)).toBe('hello');
  });

  it('env() returns undefined for missing keys', () => {
    const rt = nodeRuntime();
    expect(rt.env(TEMP_KEY)).toBeUndefined();
  });

  it('stdoutIsTTY returns a boolean', () => {
    const rt = nodeRuntime();
    expect(typeof rt.stdoutIsTTY).toBe('boolean');
  });

  it('stdinIsTTY returns a boolean', () => {
    const rt = nodeRuntime();
    expect(typeof rt.stdinIsTTY).toBe('boolean');
  });

  it('columns returns a number', () => {
    const rt = nodeRuntime();
    expect(typeof rt.columns).toBe('number');
    expect(rt.columns).toBeGreaterThan(0);
  });

  it('rows returns a number', () => {
    const rt = nodeRuntime();
    expect(typeof rt.rows).toBe('number');
    expect(rt.rows).toBeGreaterThan(0);
  });
});
