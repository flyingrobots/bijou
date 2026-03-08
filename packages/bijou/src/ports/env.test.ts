import { describe, it, expect } from 'vitest';
import { createEnvAccessor, createTTYAccessor } from './env.js';
import type { RuntimePort } from './runtime.js';

describe('createEnvAccessor()', () => {
  it('reads from RuntimePort', () => {
    const runtime: RuntimePort = {
      env: (key: string) => (key === 'FOO' ? 'bar' : undefined),
      stdoutIsTTY: true,
      stdinIsTTY: true,
      columns: 80,
      rows: 24,
    };

    const env = createEnvAccessor(runtime);
    expect(env('FOO')).toBe('bar');
    expect(env('MISSING')).toBeUndefined();
  });
});

describe('createTTYAccessor()', () => {
  it('reads from RuntimePort.stdoutIsTTY when false', () => {
    const runtime: RuntimePort = {
      env: () => undefined,
      stdoutIsTTY: false,
      stdinIsTTY: false,
      columns: 80,
      rows: 24,
    };

    expect(createTTYAccessor(runtime)).toBe(false);
  });

  it('returns true when RuntimePort.stdoutIsTTY is true', () => {
    const runtime: RuntimePort = {
      env: () => undefined,
      stdoutIsTTY: true,
      stdinIsTTY: true,
      columns: 120,
      rows: 24,
    };

    expect(createTTYAccessor(runtime)).toBe(true);
  });
});
