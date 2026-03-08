import { describe, it, expect } from 'vitest';
import { createEnvAccessor, createTTYAccessor } from './env.js';
import { mockRuntime } from '../adapters/test/runtime.js';

describe('createEnvAccessor()', () => {
  it('reads from RuntimePort', () => {
    const runtime = mockRuntime({ env: { FOO: 'bar' } });

    const env = createEnvAccessor(runtime);
    expect(env('FOO')).toBe('bar');
    expect(env('MISSING')).toBeUndefined();
  });
});

describe('createTTYAccessor()', () => {
  it('reads from RuntimePort.stdoutIsTTY when false', () => {
    const runtime = mockRuntime({ stdoutIsTTY: false });
    expect(createTTYAccessor(runtime)).toBe(false);
  });

  it('returns true when RuntimePort.stdoutIsTTY is true', () => {
    const runtime = mockRuntime({ stdoutIsTTY: true });
    expect(createTTYAccessor(runtime)).toBe(true);
  });
});
