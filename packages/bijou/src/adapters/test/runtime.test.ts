import { describe, it, expect } from 'vitest';
import { mockRuntime } from './runtime.js';

describe('mockRuntime()', () => {
  it('env() returns values from provided env map', () => {
    const rt = mockRuntime({ env: { FOO: 'bar' } });
    expect(rt.env('FOO')).toBe('bar');
  });

  it('env() returns undefined for missing keys', () => {
    const rt = mockRuntime({ env: { FOO: 'bar' } });
    expect(rt.env('MISSING')).toBeUndefined();
  });

  it('env() returns undefined by default with no env map', () => {
    const rt = mockRuntime();
    expect(rt.env('ANYTHING')).toBeUndefined();
  });

  it('stdoutIsTTY defaults to true', () => {
    expect(mockRuntime().stdoutIsTTY).toBe(true);
  });

  it('stdoutIsTTY reflects options', () => {
    expect(mockRuntime({ stdoutIsTTY: false }).stdoutIsTTY).toBe(false);
  });

  it('stdinIsTTY defaults to true', () => {
    expect(mockRuntime().stdinIsTTY).toBe(true);
  });

  it('stdinIsTTY reflects options', () => {
    expect(mockRuntime({ stdinIsTTY: false }).stdinIsTTY).toBe(false);
  });

  it('columns defaults to 80', () => {
    expect(mockRuntime().columns).toBe(80);
  });

  it('columns reflects options', () => {
    expect(mockRuntime({ columns: 120 }).columns).toBe(120);
  });

  it('rows defaults to 24', () => {
    expect(mockRuntime().rows).toBe(24);
  });

  it('rows reflects options', () => {
    expect(mockRuntime({ rows: 50 }).rows).toBe(50);
  });
});
