import { describe, expect, it } from 'vitest';
import { createWebInteractiveIO, createWebRuntime } from './index.js';
import type { WebMouseMsg } from './index.js';
import type { WebPointerEvent, WebRect } from './web-dom.js';
import { createFakeTarget, withPrevent } from './interactive.test-support.js';

const RECT: WebRect = { left: 10, top: 20, width: 800, height: 480 };

function setup(rect: WebRect = RECT, runtime = createWebRuntime({ columns: 80, rows: 24 })) {
  const base = createFakeTarget<WebPointerEvent>();
  const surface = Object.assign(base, { getBoundingClientRect: () => rect });
  const io = createWebInteractiveIO({ surface, runtime });
  const mouse: WebMouseMsg[] = [];
  const raw: string[] = [];
  io.mouseInput((msg) => mouse.push(msg));
  io.rawInput((data) => raw.push(data));
  const fire = (type: string, fields: Partial<WebPointerEvent>) =>
    surface.dispatch(type, withPrevent({ clientX: 0, clientY: 0, ...fields }));
  return { surface, io, mouse, raw, fire, runtime };
}

describe('createWebInteractiveIO() cellFromPoint', () => {
  it.each([
    [10, 20, 0, 0],
    [19.9, 39.9, 0, 0],
    [20, 40, 1, 1],
    [409, 260, 39, 12],
    [809.9, 499.9, 79, 23],
  ])('maps client (%f, %f) to the 0-based cell (%i, %i)', (x, y, col, row) => {
    expect(setup().io.cellFromPoint(x, y)).toEqual({ col, row });
  });

  it.each([
    [-500, -500, 0, 0],
    [5000, 5000, 79, 23],
    [810, 500, 79, 23],
    [Number.NaN, Number.NaN, 0, 0],
    [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 79, 0],
  ])('clamps client (%f, %f) to (%i, %i)', (x, y, col, row) => {
    expect(setup().io.cellFromPoint(x, y)).toEqual({ col, row });
  });

  it('maps every point to cell (0, 0) when the surface has no area', () => {
    const { io } = setup({ left: 0, top: 0, width: 0, height: 0 });
    expect(io.cellFromPoint(50, 50)).toEqual({ col: 0, row: 0 });
  });

  it('follows the runtime size after a resize', () => {
    const { io, runtime } = setup();
    runtime.resize(40, 12);
    expect(io.cellFromPoint(809.9, 499.9)).toEqual({ col: 39, row: 11 });
  });
});

describe('createWebInteractiveIO() pointer events', () => {
  it('emits 0-based cells in the structured message and 1-based cells only in the SGR packet', () => {
    const { mouse, raw, fire } = setup();
    fire('pointerdown', { clientX: 10, clientY: 20, button: 0 });
    expect(mouse).toEqual([{
      type: 'mouse', button: 'left', action: 'press', col: 0, row: 0, shift: false, alt: false, ctrl: false,
    }]);
    expect(raw).toEqual(['\x1b[<0;1;1M']);
  });

  it('emits the last cell as (79, 23) and as 80;24 on the wire', () => {
    const { mouse, raw, fire } = setup();
    fire('pointerdown', { clientX: 809, clientY: 499, button: 0 });
    expect([mouse[0]?.col, mouse[0]?.row]).toEqual([79, 23]);
    expect(raw).toEqual(['\x1b[<0;80;24M']);
  });

  it('maps a left-button drag from press through move to release', () => {
    const { mouse, raw, fire } = setup();
    fire('pointerdown', { clientX: 25, clientY: 45, button: 0, buttons: 1 });
    fire('pointermove', { clientX: 45, clientY: 65, buttons: 1 });
    fire('pointerup', { clientX: 65, clientY: 85, button: 0, buttons: 0 });
    expect(mouse.map((m) => [m.action, m.button, m.col, m.row])).toEqual([
      ['press', 'left', 1, 1], ['move', 'left', 3, 2], ['release', 'left', 5, 3],
    ]);
    expect(raw).toEqual(['\x1b[<0;2;2M', '\x1b[<32;4;3M', '\x1b[<0;6;4m']);
  });

  it.each([
    [1, 'left', 32], [2, 'right', 34], [4, 'middle', 33], [0, 'none', 35],
  ])('maps a move with buttons %i to %s and code %i', (buttons, button, code) => {
    const { mouse, raw, fire } = setup();
    fire('pointermove', { clientX: 10, clientY: 20, buttons });
    expect(mouse[0]?.button).toBe(button);
    expect(raw).toEqual([`\x1b[<${String(code)};1;1M`]);
  });

  it.each([[0, 'left', 0], [1, 'middle', 1], [2, 'right', 2]])(
    'maps pointer button %i to %s',
    (pointerButton, button, code) => {
      const { mouse, raw, fire } = setup();
      fire('pointerdown', { clientX: 10, clientY: 20, button: pointerButton });
      fire('pointerup', { clientX: 10, clientY: 20, button: pointerButton });
      expect(mouse.map((m) => m.button)).toEqual([button, button]);
      expect(raw).toEqual([`\x1b[<${String(code)};1;1M`, `\x1b[<${String(code)};1;1m`]);
    },
  );

  it('ignores pointer buttons beyond the first three', () => {
    const { mouse, fire } = setup();
    fire('pointerdown', { clientX: 10, clientY: 20, button: 3 });
    expect(mouse).toEqual([]);
  });

  it('carries shift, alt (or meta), and ctrl into the message and the packet', () => {
    const { mouse, raw, fire } = setup();
    fire('pointerdown', { clientX: 10, clientY: 20, button: 0, shiftKey: true, ctrlKey: true });
    fire('pointerdown', { clientX: 10, clientY: 20, button: 0, metaKey: true });
    expect(mouse.map((m) => [m.shift, m.alt, m.ctrl])).toEqual([[true, false, true], [false, true, false]]);
    expect(raw).toEqual(['\x1b[<20;1;1M', '\x1b[<8;1;1M']);
  });

  it('clamps a drag that leaves the surface to the edge cell', () => {
    const { mouse, raw, fire } = setup();
    fire('pointermove', { clientX: 9000, clientY: -9000, buttons: 1 });
    expect([mouse[0]?.col, mouse[0]?.row]).toEqual([79, 0]);
    expect(raw).toEqual(['\x1b[<32;80;1M']);
  });

  it('maps wheel up and down, ignores a zero delta, and prevents page scroll', () => {
    const { surface, mouse, raw, fire } = setup();
    const up = fire('wheel', { clientX: 30, clientY: 60, deltaY: -120 });
    fire('wheel', { clientX: 30, clientY: 60, deltaY: 120 });
    const none = fire('wheel', { clientX: 30, clientY: 60, deltaY: 0 });
    expect(mouse.map((m) => [m.action, m.button, m.col, m.row])).toEqual([
      ['scroll-up', 'none', 2, 2], ['scroll-down', 'none', 2, 2],
    ]);
    expect(raw).toEqual(['\x1b[<64;3;3M', '\x1b[<65;3;3M']);
    expect(up.prevented()).toBe(true);
    expect(none.prevented()).toBe(false);
    expect(surface.optionsFor('wheel')).toEqual({ passive: false });
  });
});
