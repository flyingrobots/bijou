import { describe, expect, it } from 'vitest';
import type { Surface } from '@flyingrobots/bijou';
import type { Cmd } from '@flyingrobots/bijou-tui';
import { starfieldDemo } from '../examples/fun/demos/starfield.js';
import { landingPage, landingPicture, landingSettings, type LandingModel } from '../examples/fun/landing.js';
import { funContext, textOf } from './helpers/fun-demos.js';

const ctx = funContext(100, 30);

function setup() {
  let opened = 0;
  const page = landingPage({ ctx, background: starfieldDemo, open: () => { opened += 1; }, seed: 7 });
  const [model] = page.init();
  return { page, model, opened: () => opened };
}

function runCmds(cmds: readonly Cmd<unknown>[]): void {
  for (const cmd of cmds) void cmd(() => undefined, { onPulse: () => ({ dispose: () => undefined }) });
}

/** Rows that hold a cell painted in the wordmark's dark blue. */
function wordmarkRowSpan(surface: Surface): readonly [number, number] {
  const rows: number[] = [];
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const fg = surface.get(x, y).fgRGB;
      if (fg !== undefined && fg[0] === 20 && fg[1] === 40 && fg[2] === 110) { rows.push(y); break; }
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

  it('binds Enter to open the demos, and the message opens them', () => {
    const { page, model, opened } = setup();
    expect(page.keyMap?.handle({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false })).toEqual({ type: 'open' });
    runCmds(page.update({ type: 'open' }, model)[1]);
    expect(opened()).toBe(1);
  });

  it('runs the background on pulses and pauses it with the motion toggle', () => {
    const { page, model } = setup();
    const step = (m: LandingModel): LandingModel => page.update({ type: 'pulse', dt: 1 / 30 }, m)[0];
    let later = model;
    for (let i = 0; i < 20; i += 1) later = step(later);
    expect(textOf(landingPicture(later, 100, 28, ctx))).not.toBe(textOf(landingPicture(model, 100, 28, ctx)));
    const [paused] = page.update({ type: 'toggle-motion' }, later);
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
