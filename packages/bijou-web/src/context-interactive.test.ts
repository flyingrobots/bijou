import { describe, expect, it } from 'vitest';
import { createWebInteractiveContext } from './index.js';
import { createFakeTarget, withPrevent } from './interactive.test-support.js';
import type { WebPointerEvent, WebTextEvent } from './web-dom.js';

function setup() {
  const textarea = Object.assign(createFakeTarget<WebTextEvent>(), { value: '' });
  const surface = Object.assign(createFakeTarget<WebPointerEvent>(), {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 480 }),
  });
  const ctx = createWebInteractiveContext({ input: { textarea, surface }, runtime: { columns: 80, rows: 24 } });
  return { textarea, surface, ctx };
}

describe('createWebInteractiveContext()', () => {
  it('composes a context whose io reads the textarea through rawInput', () => {
    const { ctx, textarea } = setup();
    const raw: string[] = [];
    const handle = ctx.io.rawInput((data) => raw.push(data));
    textarea.dispatch('keydown', withPrevent({ key: 'a' }));
    handle.dispose();
    expect(raw).toEqual(['a']);
    expect(ctx.mode).toBe('interactive');
  });

  it('hit-tests and encodes pointer input against the context runtime size', () => {
    const { ctx, surface } = setup();
    const raw: string[] = [];
    ctx.io.rawInput((data) => raw.push(data));
    ctx.runtime.resize(40, 12);
    surface.dispatch('pointerdown', withPrevent({ clientX: 799, clientY: 479, button: 0 }));
    expect(raw).toEqual(['\x1b[<0;40;12M']);
    expect(ctx.io.cellFromPoint(799, 479)).toEqual({ col: 39, row: 11 });
    ctx.io.dispose();
  });

  it('forwards runtime resizes to io.onResize', () => {
    const { ctx } = setup();
    const sizes: [number, number][] = [];
    ctx.io.onResize((columns, rows) => sizes.push([columns, rows]));
    ctx.runtime.resize(100, 30);
    expect(sizes).toEqual([[100, 30]]);
  });

  it('removes every input listener on io.dispose()', () => {
    const { ctx, textarea, surface } = setup();
    ctx.io.rawInput(() => undefined);
    expect(textarea.listenerCount() + surface.listenerCount()).toBeGreaterThan(0);
    ctx.io.dispose();
    expect(textarea.listenerCount() + surface.listenerCount()).toBe(0);
  });
});
