import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import { isFrameScopedMsg, type Cmd } from '@flyingrobots/bijou-tui';
import { starfieldDemo } from '../examples/fun/demos/starfield.js';
import { demosPage } from '../examples/fun/demos-page.js';
import type { DemosModel, FunModel, LandingModel } from '../examples/fun/fun-app-types.js';
import { landingPage, landingPicture, landingSettings } from '../examples/fun/landing.js';
import { surfaceDemo } from '../examples/fun/demos/surface.js';
import { funContext, textOf } from './helpers/fun-demos.js';

const ctx = funContext(100, 30);

function home(model: FunModel): LandingModel {
  if (model.kind !== 'home') throw new Error('expected the Home page model');
  return model;
}

function demos(model: FunModel): DemosModel {
  if (model.kind !== 'demos') throw new Error('expected the Demos page model');
  return model;
}

function setup() {
  const page = landingPage({ ctx, background: starfieldDemo, seed: 7 });
  const model = home(page.init()[0]);
  return { page, model };
}

function emitted(cmds: readonly Cmd<unknown>[]): unknown[] {
  const out: unknown[] = [];
  for (const cmd of cmds) void cmd((msg) => { out.push(msg); }, { onPulse: () => ({ dispose: () => undefined }) });
  return out;
}

/** Rows that hold a cell painted in the wordmark's dark blue. */
function wordmarkRowSpan(surface: Surface): readonly [number, number] {
  const rows: number[] = [];
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const fg = surface.get(x, y).fgRGB;
      if (fg?.[0] === 20 && fg[1] === 40 && fg[2] === 110) { rows.push(y); break; }
    }
  }
  return [rows[0] ?? -1, rows.at(-1) ?? -1];
}

describe('the landing page of the published site', () => {
  it('centres the wordmark vertically in the pane', () => {
    const { model } = setup();
    const [first, last] = wordmarkRowSpan(landingPicture(model, 100, 28, ctx));
    expect(first).toBeGreaterThan(0);
    expect(Math.abs(first - (28 - 1 - last))).toBeLessThanOrEqual(2);
  });

  it('lets the background show between the letters: no blank band across the wordmark rows', () => {
    const { model } = setup();
    const withMark = landingPicture(model, 100, 28, ctx);
    const without = landingPicture({ ...model, wordmark: false }, 100, 28, ctx);
    const [first] = wordmarkRowSpan(withMark);
    let unchanged = 0;
    for (let x = 0; x < 100; x += 1) if (withMark.get(x, first).char === without.get(x, first).char) unchanged += 1;
    expect(unchanged).toBeGreaterThan(30);
  });

  it('binds Enter to the Demos page: the message asks the frame for the next tab', () => {
    const { page, model } = setup();
    expect(page.keyMap?.handle({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false })).toEqual({ type: 'open' });
    const [sent] = emitted(page.update({ type: 'open' }, model)[1]);
    expect(isFrameScopedMsg(sent) ? sent.action : undefined).toEqual({ type: 'next-tab' });
  });

  it('runs the background on pulses and pauses it with the motion toggle', () => {
    const { page, model } = setup();
    const step = (m: LandingModel): LandingModel => home(page.update({ type: 'pulse', dt: 1 / 30 }, m)[0]);
    let later = model;
    for (let i = 0; i < 20; i += 1) later = step(later);
    expect(textOf(landingPicture(later, 100, 28, ctx))).not.toBe(textOf(landingPicture(model, 100, 28, ctx)));
    const paused = home(page.update({ type: 'toggle-motion' }, later)[0]);
    expect(paused.background.paused).toBe(true);
    expect(textOf(landingPicture(step(paused), 100, 28, ctx))).toBe(textOf(landingPicture(paused, 100, 28, ctx)));
  });

  it('offers wordmark, motion and open in the F2 settings, reflecting the model', () => {
    const { model } = setup();
    const rows = landingSettings({ pageModel: { ...model, wordmark: false } }).sections.flatMap((section) => section.rows);
    expect(rows.map((row) => row.id)).toEqual(['wordmark', 'motion', 'open']);
    expect(rows[0]?.checked).toBe(false);
    expect(rows[1]?.checked).toBe(true);
  });
});

describe('the Demos page of the fun app', () => {
  const entries = [starfieldDemo, surfaceDemo];
  const page = demosPage({ ctx, entries, seed: 7 });
  const start = demos(page.init()[0]);
  const key = (name: string) => ({ type: 'key' as const, key: name, ctrl: false, alt: false, shift: false });

  it('lists every demo and moves the selection, running the selected demo', () => {
    expect(start.list.items.map((item) => item.label)).toEqual(['Star Field', '3D Wave Surface']);
    const next = demos(page.update({ type: 'demos-next' }, start)[0]);
    expect(next.list.focusIndex).toBe(1);
    expect(next.session).not.toBe(start.session);
  });

  it('sends every key to the playing demo and comes back to the list on Escape', () => {
    expect(page.modalKeyMap?.(start)).toBeUndefined();
    const playing = demos(page.update({ type: 'demos-play' }, start)[0]);
    const keys = page.modalKeyMap?.(playing);
    expect(keys?.handle(key('+'))).toEqual({ type: 'demos-key', key: '+' });
    expect(keys?.handle(key('q'))).toEqual({ type: 'demos-key', key: 'q' });
    expect(keys?.handle(key('escape'))).toEqual({ type: 'demos-stop' });
    expect(demos(page.update({ type: 'demos-stop' }, playing)[0]).playing).toBe(false);
  });
});
