import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { Cmd, KeyMsg, ViewOutput } from '@flyingrobots/bijou-tui';
import { starfieldDemo } from '../examples/fun/demos/starfield.js';
import { createLandingApp } from '../examples/fun/landing.js';
import { funContext, textOf } from './helpers/fun-demos.js';

const CARDS = [
  { id: 'starfield', name: 'Star Field', description: 'Stars rush past the viewer' },
  { id: 'doyle-spiral', name: 'Doyle Spiral', description: 'Touching circles in a spiral' },
  { id: 'deformed-rectangles', name: 'Deformed Rectangles', description: 'A square split into quads' },
];

const key = (name: string): KeyMsg => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false });

function setup() {
  const opened: string[] = [];
  const ctx = funContext(100, 30);
  const app = createLandingApp({ ctx, cards: CARDS, background: starfieldDemo, open: (id) => { opened.push(id); }, seed: 7 });
  const [model] = app.init();
  return { app, ctx, model, opened };
}

function asSurface(view: ViewOutput): Surface {
  if ('rect' in view) throw new Error('the landing app paints a Surface, not a layout tree');
  return view;
}

function runCmds(cmds: readonly Cmd<unknown>[]): void {
  for (const cmd of cmds) void cmd(() => undefined, { onPulse: () => ({ dispose: () => undefined }) });
}

describe('the landing app of the published site', () => {
  it('does not pass the pointer to the background demo', () => {
    const { app, model } = setup();
    const [moved] = app.update({ type: 'mouse', action: 'move', button: 'none', col: 2, row: 2, ctrl: false, alt: false, shift: false }, model);
    expect(moved.background).toBe(model.background);
  });

  it('paints one card per demo, named in its title', () => {
    const { app, model } = setup();
    const text = textOf(asSurface(app.view(model)));
    for (const card of CARDS) expect(text).toContain(card.name);
    expect(text).toContain('▶ Star Field');
  });

  it('moves the selection with the arrow keys and opens the selected demo on Enter', () => {
    const { app, model, opened } = setup();
    const [right] = app.update(key('right'), model);
    expect(right.selected).toBe(1);
    expect(textOf(asSurface(app.view(right)))).toContain('▶ Doyle Spiral');
    const [, cmds] = app.update(key('enter'), right);
    runCmds(cmds);
    expect(opened).toEqual(['doyle-spiral']);
  });

  it('keeps the selection inside the list', () => {
    const { app, model } = setup();
    const [left] = app.update(key('left'), model);
    expect(left.selected).toBe(0);
  });

  it('runs the background demo behind the cards: pulses change the picture', () => {
    const { app, model } = setup();
    let later = model;
    for (let i = 0; i < 20; i += 1) [later] = app.update({ type: 'pulse', dt: 1 / 30 }, later);
    expect(textOf(asSurface(app.view(later)))).not.toBe(textOf(asSurface(app.view(model))));
  });
});
