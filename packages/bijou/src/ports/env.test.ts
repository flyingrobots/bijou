import { describe, it, expect, vi, afterEach } from 'vitest';
import { createEnvAccessor, createTTYAccessor } from './env.js';
import type { RuntimePort } from './runtime.js';

describe('createEnvAccessor()', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads from RuntimePort when provided', () => {
    const runtime: RuntimePort = {
      env: (key: string) => (key === 'FOO' ? 'bar' : undefined),
      stdoutIsTTY: true,
      columns: 80,
    };

    const env = createEnvAccessor(runtime);
    expect(env('FOO')).toBe('bar');
    expect(env('MISSING')).toBeUndefined();
  });

  it('falls back to process.env when no runtime is provided', () => {
    vi.stubEnv('BIJOU_TEST_KEY', 'hello');

    const env = createEnvAccessor();
    expect(env('BIJOU_TEST_KEY')).toBe('hello');
    expect(env('BIJOU_NONEXISTENT_KEY')).toBeUndefined();
  });
});

describe('createTTYAccessor()', () => {
  it('reads from RuntimePort.stdoutIsTTY when provided', () => {
    const runtime: RuntimePort = {
      env: () => undefined,
      stdoutIsTTY: false,
      columns: 80,
    };

    expect(createTTYAccessor(runtime)).toBe(false);
  });

  it('returns true when RuntimePort.stdoutIsTTY is true', () => {
    const runtime: RuntimePort = {
      env: () => undefined,
      stdoutIsTTY: true,
      columns: 120,
    };

    expect(createTTYAccessor(runtime)).toBe(true);
  });

  it('falls back to process.stdout.isTTY when no runtime is provided', () => {
    // In test environments, process.stdout.isTTY is typically undefined (falsy)
    const result = createTTYAccessor();
    expect(typeof result).toBe('boolean');
  });
});
