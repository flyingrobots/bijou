import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { KeyMsg, MouseMsg, PulseMsg } from '@flyingrobots/bijou-tui';
import { createFunApp } from '../examples/fun/shell.js';
import { SEED, cellsOf, demos, digest, funContext } from './helpers/fun-demos.js';

// Wide enough for the header to list every demo by name.
const ctx = funContext(300, 30);
const app = createFunApp({ ctx, entries: demos, seed: SEED });
const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });
const mouse = (col: number, row: number, action: MouseMsg['action'] = 'move'): MouseMsg =>
  ({ type: 'mouse', button: 'none', action, col, row, shift: false, alt: false, ctrl: false });
const pulse: PulseMsg = { type: 'pulse', dt: 1 / 30 };

function send(messages: readonly (KeyMsg | MouseMsg | PulseMsg)[]): Surface {
  const [first] = app.init();
  let model = first;
  for (const msg of messages) model = app.update(msg, model)[0];
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return view;
}

function rowText(surface: Surface, row: number): string {
  return cellsOf(surface).slice(row * surface.width, (row + 1) * surface.width).map((cell) => cell.char).join('');
}

describe('the bijou-fun shell', () => {
  it('lists every demo in the header and starts on the first', () => {
    const header = rowText(send([]), 0);
    for (const entry of demos) expect(header).toContain(entry.name);
    expect(rowText(send([]), 29)).toContain(demos[0]?.description ?? 'missing');
  });

  it('switches demos with tab, shift-less arrows and digits, and wraps', () => {
    const second = rowText(send([key('tab')]), 29);
    expect(second).toContain(demos[1]?.description ?? 'missing');
    expect(rowText(send([key('3')]), 29)).toContain(demos[2]?.description ?? 'missing');
    expect(rowText(send([key('left')]), 29)).toContain(demos[demos.length - 1]?.description ?? 'missing');
    expect(rowText(send([key(String(demos.length)), key('right')]), 29)).toContain(demos[0]?.description ?? 'missing');
  });

  it('asks the runtime to quit on q', () => {
    const [first] = app.init();
    const [, commands] = app.update(key('q'), first);
    expect(commands).toHaveLength(1);
  });

  it('draws the demo into the body between the header and the footer', () => {
    const view = send([key('3'), pulse, pulse]);
    expect([view.width, view.height]).toEqual([300, 30]);
  });

  it('turns mouse moves in the body into pointer messages offset by the header, and moves outside into a leave', () => {
    const base = send([key('3'), pulse]);
    const hover = send([key('3'), pulse, mouse(50, 15)]);
    const header = send([key('3'), pulse, mouse(50, 0)]);
    const wheel = send([key('3'), pulse, mouse(50, 15, 'scroll-up')]);
    expect(digest(hover)).not.toBe(digest(base));
    expect(digest(header)).toBe(digest(base));
    expect(digest(wheel)).toBe(digest(base));
    expect(digest(send([key('3'), pulse, mouse(50, 15), mouse(50, 29)]))).toBe(digest(base));
  });

  it('keeps each demo state when switching away and back', () => {
    const away = send([key('3'), pulse, pulse, key('1'), key('3')]);
    expect(digest(away)).toBe(digest(send([key('3'), pulse, pulse])));
  });
});
