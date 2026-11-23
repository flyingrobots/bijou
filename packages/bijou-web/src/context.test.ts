import { describe, expect, it } from 'vitest';
import { alert, box, stripAnsi, table, type BijouContext } from '@flyingrobots/bijou';
import { createWebClock, createWebContext } from './index.js';
import { createFakeClockHost } from './clock.test-support.js';
import { GOLDEN, LOWERED_MODES, MODES, TABLE_COLUMNS, TABLE_ROWS } from './context.test-support.js';

function render(ctx: BijouContext): string[] {
  return [
    alert('Deploy complete', { variant: 'success', ctx }),
    box('hello', { ctx }),
    table({ columns: TABLE_COLUMNS, rows: TABLE_ROWS, ctx }),
  ];
}

describe('createWebContext() golden output', () => {
  it.each(MODES)('renders alert, box, and table exactly in %s mode with NO_COLOR=1', (mode) => {
    const sink: string[] = [];
    const clock = createWebClock({ host: createFakeClockHost() });
    const ctx = createWebContext({
      mode, clock, runtime: { env: { NO_COLOR: '1' } }, output: { write: (data) => sink.push(data) },
    });
    expect(ctx.mode).toBe(mode);
    expect(ctx.clock).toBe(clock);
    expect(ctx.theme.noColor).toBe(true);
    for (const text of render(ctx)) ctx.io.write(text);
    expect(sink).toEqual([GOLDEN[mode].alert, GOLDEN[mode].box, GOLDEN[mode].table]);
  });

  it.each(['interactive', 'static'] as const)('colors %s output that strips back to the NO_COLOR golden', (mode) => {
    const sink: string[] = [];
    const ctx = createWebContext({ mode, output: { write: (data) => sink.push(data) } });
    for (const text of render(ctx)) ctx.io.write(text);
    for (const text of sink) expect(text).toContain('\x1b[38;2;');
    expect(sink.map((text) => stripAnsi(text))).toEqual([GOLDEN[mode].alert, GOLDEN[mode].box, GOLDEN[mode].table]);
  });

  it('emits the exact SGR sequences for an explicit border token', () => {
    const ctx = createWebContext({ mode: 'interactive' });
    const red = (text: string): string => `\x1b[38;2;255;0;0m${text}\x1b[39m`;
    expect(box('hello', { borderToken: { hex: '#ff0000' }, ctx })).toBe(
      [red('┌───────┐'), `${red('│')} hello ${red('│')}`, red('└───────┘')].join('\n'),
    );
  });

  it.each(['pipe', 'accessible'] as const)('keeps %s output free of escape sequences without NO_COLOR', (mode) => {
    const ctx = createWebContext({ mode });
    expect(render(ctx)).toEqual([GOLDEN[mode].alert, GOLDEN[mode].box, GOLDEN[mode].table]);
  });

  it.each(LOWERED_MODES)('delivers lowered %s text to the in-memory buffer when no sink is supplied', (mode) => {
    const ctx = createWebContext({ mode, runtime: { env: { NO_COLOR: '1' } } });
    for (const text of render(ctx)) ctx.io.write(`${text}\n`);
    expect(ctx.io.output()).toBe(`${GOLDEN[mode].alert}\n${GOLDEN[mode].box}\n${GOLDEN[mode].table}\n`);
    expect(ctx.io.errorOutput()).toBe('');
  });
});

describe('createWebContext() composition', () => {
  it.each([
    ['interactive', {}],
    ['accessible', { env: { BIJOU_ACCESSIBLE: '1' } }],
    ['pipe', { env: { TERM: 'dumb' } }],
    ['pipe', { stdoutIsTTY: false }],
    ['static', { env: { CI: 'true' } }],
  ] as const)('detects %s mode from the runtime when no mode is given', (mode, runtime) => {
    expect(createWebContext({ runtime }).mode).toBe(mode);
  });

  it('works in a headless worker environment where window is undefined', () => {
    expect(Reflect.has(globalThis, 'window')).toBe(false);
    expect(Reflect.has(globalThis, 'document')).toBe(false);
    const ctx = createWebContext({ mode: 'static', runtime: { env: { NO_COLOR: '1' } } });
    expect(render(ctx)).toEqual([GOLDEN.static.alert, GOLDEN.static.box, GOLDEN.static.table]);
    expect(ctx.clock.now()).toBeGreaterThan(0);
  });

  it('connects runtime resizes to the I/O port and exposes mutable dimensions', () => {
    const ctx = createWebContext({ runtime: { columns: 0, rows: -3 } });
    expect([ctx.runtime.columns, ctx.runtime.rows]).toEqual([1, 1]);
    const seen: number[][] = [];
    ctx.io.onResize((columns, rows) => { seen.push([columns, rows]); });
    ctx.runtime.resize(120, 40);
    expect(seen).toEqual([[120, 40]]);
  });

  it('falls back to the default theme when BIJOU_THEME names a file it cannot read', () => {
    const themed = createWebContext({ runtime: { env: { BIJOU_THEME: 'theme.json' } } });
    expect(themed.semantic('primary')).toEqual(createWebContext().semantic('primary'));
  });

  it('routes error text and bytes to their own sinks', () => {
    const errors: string[] = [];
    const bytes: number[] = [];
    const ctx = createWebContext({
      output: { writeError: (data) => errors.push(data), writeBytes: (chunk) => bytes.push(...chunk) },
    });
    ctx.io.writeError('boom');
    ctx.io.writeBytes(Uint8Array.of(1, 2, 3), 2);
    expect([errors, bytes]).toEqual([['boom'], [1, 2]]);
  });
});
