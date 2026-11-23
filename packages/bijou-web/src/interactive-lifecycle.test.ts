import { describe, expect, it } from 'vitest';
import type { KeyInputMsg } from '@flyingrobots/bijou';
import { createWebInteractiveIO, createWebRuntime } from './index.js';
import type { WebMouseMsg } from './index.js';
import type { WebPointerEvent, WebTextEvent } from './web-dom.js';
import { createFakeTarget, withPrevent } from './interactive.test-support.js';

function setup() {
  const textarea = Object.assign(createFakeTarget<WebTextEvent>(), { value: '' });
  const surface = Object.assign(createFakeTarget<WebPointerEvent>(), {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 480 }),
  });
  const runtime = createWebRuntime();
  const io = createWebInteractiveIO({ textarea, surface, runtime, resize: (cb) => runtime.onResize(cb) });
  const live = () => textarea.listenerCount() + surface.listenerCount();
  const press = (key: string) => textarea.dispatch('keydown', withPrevent({ key }));
  const click = () => surface.dispatch('pointerdown', withPrevent({ clientX: 0, clientY: 0, button: 0 }));
  return { textarea, surface, runtime, io, live, press, click };
}

describe('createWebInteractiveIO() lifecycle', () => {
  it('attaches no listener until something subscribes', () => {
    const { live, io } = setup();
    expect(live()).toBe(0);
    const handle = io.keyInput((() => undefined));
    expect(live()).toBeGreaterThan(0);
    handle.dispose();
    expect(live()).toBe(0);
  });

  it('stops delivering at once on dispose, and a second dispose is harmless', () => {
    const { io, press, live } = setup();
    const keys: KeyInputMsg[] = [];
    const handle = io.keyInput((key) => keys.push(key));
    press('a');
    handle.dispose();
    handle.dispose();
    press('b');
    expect(keys.map((key) => key.key)).toEqual(['a']);
    expect(live()).toBe(0);
  });

  it('keeps delivering to a second subscriber after the first disposes', () => {
    const { io, press, live } = setup();
    const first: string[] = [];
    const second: string[] = [];
    const a = io.keyInput((key) => first.push(key.key));
    io.keyInput((key) => second.push(key.key));
    press('x');
    a.dispose();
    press('y');
    expect([first, second]).toEqual([['x'], ['x', 'y']]);
    expect(live()).toBeGreaterThan(0);
  });

  it('removes every listener and stops every stream on io.dispose(), twice over', () => {
    const { io, press, click, live, runtime } = setup();
    const seen: string[] = [];
    io.keyInput((key) => seen.push(key.key));
    io.rawInput((data) => seen.push(data));
    io.mouseInput((msg: WebMouseMsg) => seen.push(msg.action));
    io.onResize((cols) => seen.push(`resize ${String(cols)}`));
    io.dispose();
    io.dispose();
    press('a');
    click();
    runtime.resize(100, 30);
    expect(seen).toEqual([]);
    expect(live()).toBe(0);
  });

  it('gives an inert handle to a subscription made after io.dispose()', () => {
    const { io, press, live } = setup();
    io.dispose();
    const seen: string[] = [];
    const handle = io.keyInput((key) => seen.push(key.key));
    press('a');
    handle.dispose();
    expect(seen).toEqual([]);
    expect(live()).toBe(0);
  });

  it('forwards resize columns and rows to onResize until disposed', () => {
    const { io, runtime } = setup();
    const sizes: [number, number][] = [];
    const handle = io.onResize((cols, rows) => sizes.push([cols, rows]));
    runtime.resize(100, 30);
    handle.dispose();
    handle.dispose();
    runtime.resize(120, 40);
    expect(sizes).toEqual([[100, 30]]);
  });

  it('no longer refuses rawInput, and still writes output', () => {
    const { io } = setup();
    expect(() => { io.rawInput(() => undefined).dispose(); }).not.toThrow();
    io.write('hi');
    expect(io.output()).toBe('hi');
  });

  it('works with no textarea and no surface', () => {
    const io = createWebInteractiveIO();
    expect(() => { io.keyInput(() => undefined).dispose(); }).not.toThrow();
    expect(io.cellFromPoint(5, 5)).toEqual({ col: 0, row: 0 });
  });

  it('leaves zero listeners after 1,000 mixed resize, key, and pointer events', () => {
    const { io, press, click, live, runtime, textarea } = setup();
    let delivered = 0;
    const count = (): void => { delivered++; };
    const handles = [io.keyInput(count), io.rawInput(count), io.mouseInput(count), io.onResize(count)];
    for (let i = 0; i < 1000; i++) {
      if (i % 3 === 0) runtime.resize(80 + (i % 7), 24 + (i % 5));
      else if (i % 3 === 1) press('a');
      else click();
      if (i % 100 === 0) {
        textarea.dispatch('compositionstart', withPrevent({}));
        textarea.dispatch('compositionend', withPrevent({ data: '' }));
      }
    }
    expect(delivered).toBeGreaterThan(1000);
    for (const handle of handles) handle.dispose();
    const before = delivered;
    press('a');
    click();
    runtime.resize(10, 10);
    expect(delivered).toBe(before);
    expect(live()).toBe(0);
  });
});
