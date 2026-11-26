import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { KeyMsg, MouseMsg, PulseMsg } from '@flyingrobots/bijou-tui';
import { createFunApp } from '../examples/fun/shell.js';
import { SEED, funContext } from './helpers/fun-demos.js';
import { recordingDemo, rowText } from './helpers/fun-stub.js';

// The shell is given its demos, so these tests give it fakes: what the real catalog holds cannot change them.
const demos = ['one', 'two', 'three', 'four'].map((id) => recordingDemo(id, `Demo ${id}`, `The fake demo ${id}`));
const ctx = funContext(100, 30);
const app = createFunApp({ ctx, entries: demos, seed: SEED });
const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });
const mouse = (col: number, row: number, action: MouseMsg['action'] = 'move'): MouseMsg =>
  ({ type: 'mouse', button: 'none', action, col, row, shift: false, alt: false, ctrl: false });
const pulse: PulseMsg = { type: 'pulse', dt: 1 / 30 };
/** The screen rows of the fake's own rows: the pane starts under the header row. */
const KEYS = 1;
const POINTER = 2;
const PULSES = 3;

function send(messages: readonly (KeyMsg | MouseMsg | PulseMsg)[]): Surface {
  const [first] = app.init();
  let model = first;
  for (const msg of messages) model = app.update(msg, model)[0];
  const view = app.view(model);
  if (!('cells' in view)) throw new Error('the shell must return a Surface');
  return view;
}

describe('the bijou-fun shell', () => {
  it('lists every demo in the header and starts on the first', () => {
    const header = rowText(send([]), 0);
    for (const entry of demos) expect(header).toContain(entry.name);
    expect(rowText(send([]), 29)).toContain('The fake demo one');
  });

  it('switches demos with tab, shift-less arrows and digits, and wraps', () => {
    expect(rowText(send([key('tab')]), 29)).toContain('The fake demo two');
    expect(rowText(send([key('3')]), 29)).toContain('The fake demo three');
    expect(rowText(send([key('left')]), 29)).toContain('The fake demo four');
    expect(rowText(send([key('4'), key('right')]), 29)).toContain('The fake demo one');
    // A digit past the last demo is no shell key: the demo hears it.
    expect(rowText(send([key('5')]), KEYS)).toContain('keys 5');
  });

  it('asks the runtime to quit on q', () => {
    const [first] = app.init();
    const [, commands] = app.update(key('q'), first);
    expect(commands).toHaveLength(1);
  });

  it('draws the demo into the body between the header and the footer, and tells it that pane', () => {
    const view = send([key('3'), pulse, pulse]);
    expect([view.width, view.height]).toEqual([100, 30]);
    expect(rowText(view, PULSES)).toContain('pane 100x28 pulses 2');
  });

  it('turns mouse moves in the body into pointer messages offset by the header, and moves outside into a leave', () => {
    expect(rowText(send([key('3'), pulse]), POINTER)).toContain('pointer none');
    expect(rowText(send([key('3'), pulse, mouse(50, 15)]), POINTER)).toContain('pointer 50,14');
    expect(rowText(send([key('3'), pulse, mouse(50, 0)]), POINTER)).toContain('pointer left');
    expect(rowText(send([key('3'), pulse, mouse(50, 15, 'scroll-up')]), POINTER)).toContain('pointer none');
    expect(rowText(send([key('3'), pulse, mouse(50, 15), mouse(50, 29)]), POINTER)).toContain('pointer left');
  });

  it('pulses only the demo that is showing, and keeps each demo state when switching away and back', () => {
    const away = send([key('3'), pulse, pulse, key('1'), pulse, key('3')]);
    expect(rowText(away, PULSES)).toContain('pulses 2');
    expect(rowText(send([key('3'), pulse, pulse, key('1')]), PULSES)).toContain('pulses 0');
  });

  it('keeps each demo state when switching with tab and the arrows, as with the digits', () => {
    expect(rowText(send([key('3'), pulse, pulse, key('tab'), key('left')]), PULSES)).toContain('pulses 2');
    expect(rowText(send([key('3'), pulse, pulse, key('left'), key('right')]), PULSES)).toContain('pulses 2');
    expect(rowText(send([key('3'), pulse, key('k'), key('right'), key('left')]), KEYS)).toContain('keys k');
  });
});
