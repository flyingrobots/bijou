import { describe, expect, it } from 'vitest';
import type { RuntimePort } from '../ports/runtime.js';
import {
  installRuntimeViewportOverlay,
  readRuntimeViewport,
  sanitizeRuntimeDimension,
  updateRuntimeViewport,
} from './runtime-viewport.js';

function createRuntime(columns: number, rows: number): RuntimePort {
  return {
    env(key: string): string | undefined {
      return key === 'TEST_KEY' ? 'ok' : undefined;
    },
    stdoutIsTTY: true,
    stdinIsTTY: false,
    columns,
    rows,
    refreshRate: 144,
  };
}

describe('runtime viewport helpers', () => {
  it('sanitizes runtime dimensions to non-negative integers', () => {
    expect(sanitizeRuntimeDimension(12.9)).toBe(12);
    expect(sanitizeRuntimeDimension(-5)).toBe(0);
    expect(sanitizeRuntimeDimension(Number.NaN)).toBe(0);
    expect(sanitizeRuntimeDimension(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('installs a mutable viewport overlay without mutating the base runtime object', () => {
    const baseRuntime = createRuntime(120.8, -2);
    const host = { runtime: baseRuntime };

    const runtime = installRuntimeViewportOverlay(host);

    expect(host.runtime).toBe(runtime);
    expect(readRuntimeViewport(runtime)).toEqual({ columns: 120, rows: 0 });
    expect(runtime.env('TEST_KEY')).toBe('ok');
    expect(runtime.stdoutIsTTY).toBe(true);
    expect(runtime.stdinIsTTY).toBe(false);
    expect(runtime.refreshRate).toBe(144);

    const next = updateRuntimeViewport(runtime, 90.7, 22.1);
    expect(next).toEqual({ columns: 90, rows: 22 });
    expect(readRuntimeViewport(runtime)).toEqual({ columns: 90, rows: 22 });
    expect(baseRuntime.columns).toBe(120.8);
    expect(baseRuntime.rows).toBe(-2);
  });
});
