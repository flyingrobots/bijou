import { describe, expect, it } from 'vitest';
import { createWebRuntime } from './index.js';

describe('createWebRuntime()', () => {
  it('defaults to an 80x24 output surface at 60 FPS with no input stream', () => {
    const runtime = createWebRuntime();
    expect(runtime.columns).toBe(80);
    expect(runtime.rows).toBe(24);
    expect(runtime.refreshRate).toBe(60);
    expect(runtime.stdoutIsTTY).toBe(true);
    expect(runtime.stdinIsTTY).toBe(false);
    expect(runtime.env('NO_COLOR')).toBeUndefined();
  });

  it('keeps environment variables in an in-memory map', () => {
    const source = { NO_COLOR: '1', TERM: 'xterm-256color' };
    const runtime = createWebRuntime({ env: source });
    source.TERM = 'dumb';
    expect(runtime.env('NO_COLOR')).toBe('1');
    expect(runtime.env('TERM')).toBe('xterm-256color');
    runtime.setEnv('TERM', 'dumb');
    runtime.setEnv('NO_COLOR', undefined);
    expect(runtime.env('TERM')).toBe('dumb');
    expect(runtime.env('NO_COLOR')).toBeUndefined();
    expect(runtime.env('toString')).toBeUndefined();
  });

  it('accepts configured dimensions, refresh rate, and TTY flags', () => {
    const runtime = createWebRuntime({ columns: 132, rows: 43, refreshRate: 120, stdoutIsTTY: false, stdinIsTTY: true });
    expect([runtime.columns, runtime.rows, runtime.refreshRate]).toEqual([132, 43, 120]);
    expect([runtime.stdoutIsTTY, runtime.stdinIsTTY]).toEqual([false, true]);
    runtime.stdoutIsTTY = true;
    expect(runtime.stdoutIsTTY).toBe(true);
  });

  it.each([
    ['zero', 0, 0, 1, 1],
    ['negative', -40, -1, 1, 1],
    ['fractional', 100.9, 30.2, 100, 30],
    ['not a number', Number.NaN, Number.NaN, 80, 24],
    ['infinite', Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 80, 24],
  ])('clamps %s dimensions at creation, assignment, and resize', (_label, columns, rows, wantColumns, wantRows) => {
    const created = createWebRuntime({ columns, rows });
    expect([created.columns, created.rows]).toEqual([wantColumns, wantRows]);

    const assigned = createWebRuntime();
    assigned.columns = columns;
    assigned.rows = rows;
    expect([assigned.columns, assigned.rows]).toEqual([wantColumns, wantRows]);

    const resized = createWebRuntime();
    resized.resize(columns, rows);
    expect([resized.columns, resized.rows]).toEqual([wantColumns, wantRows]);
  });

  it.each([0, -30, Number.NaN, Number.POSITIVE_INFINITY])('falls back to 60 FPS for refresh rate %s', (refreshRate) => {
    const runtime = createWebRuntime({ refreshRate });
    expect(runtime.refreshRate).toBe(60);
    runtime.refreshRate = 144;
    expect(runtime.refreshRate).toBe(144);
    runtime.refreshRate = refreshRate;
    expect(runtime.refreshRate).toBe(60);
  });

  it('notifies resize listeners with clamped dimensions until disposed', () => {
    const runtime = createWebRuntime();
    const seen: string[] = [];
    const handle = runtime.onResize((columns, rows) => { seen.push(`${String(columns)}x${String(rows)}`); });
    runtime.resize(100, 30);
    runtime.resize(100, 30);
    runtime.columns = 0;
    runtime.rows = 12;
    expect(seen).toEqual(['100x30', '1x30', '1x12']);
    handle.dispose();
    runtime.resize(40, 10);
    expect(seen).toHaveLength(3);
  });
});
