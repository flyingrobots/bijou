// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The landing page of the published site, as a framed Bijou app: one page shows
// a demo chosen by the page (the 3D wave surface) behind the Bijou wordmark in
// Jacquard 12. The frame brings the usual chrome: key hints in the footer, `?`
// help, `F2` settings, and `q` to quit with confirmation.
import { createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import {
  compositeSurface, createKeyMap, isPulseMsg, placeSurface, rasterTextSurface, wrapFrameMsg,
  type Cmd, type FramePage, type FrameScopedMsg, type FrameSettings,
} from '@flyingrobots/bijou-tui';
import { CYLINDER_FONT } from '../docs/app-cylinder-font.js';
import type { DemoEntry } from './contract.js';
import type { FunModel, FunMsg, LandingModel } from './fun-app-types.js';

export interface LandingOptions {
  readonly ctx: BijouContext;
  /** The demo that runs behind the page; the host picks it. */
  readonly background: DemoEntry;
  readonly seed: number;
}

/** The wordmark colour: dark blue, read on the wave surface's white ground. */
const WORDMARK = '#14286e';

function wordmarkRows(rows: number): number {
  return Math.max(4, Math.min(16, Math.floor(rows * 0.35)));
}

/**
 * The wordmark as a Surface layer over `picture`: Jacquard 12 glyphs in braille, centred by `placeSurface`. Only
 * glyph cells are copied onto a fresh surface, whose other cells stay empty so the picture shows through them, and
 * each glyph keeps the background of the picture cell under it.
 */
function wordmarkLayer(picture: Surface): Surface {
  const { width, height } = picture;
  const mark = rasterTextSurface('Bijou', CYLINDER_FONT, { columns: width, rows: wordmarkRows(height), renderer: { kind: 'braille' }, fg: WORDMARK });
  const placed = placeSurface(mark, { width, height, hAlign: 'center', vAlign: 'middle' });
  const layer = createSurface(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = placed.get(x, y);
      if (cell.empty === true || cell.char === ' ' || cell.char === '⠀') continue;
      layer.set(x, y, { ...cell, bg: picture.get(x, y).bg, empty: false });
    }
  }
  return layer;
}

/** The page's picture: the background demo at the pane's size, with the wordmark over it when it is on. */
export function landingPicture(model: LandingModel, width: number, height: number, ctx: BijouContext): Surface {
  const picture = model.background.view(width, height, ctx);
  return model.wordmark ? compositeSurface(picture, [{ content: '', surface: wordmarkLayer(picture), row: 0, col: 0 }]) : picture;
}

/** The one page of the landing app. */
export function landingPage({ ctx, background, seed }: LandingOptions): FramePage<FunModel, FunMsg> {
  // The Demos page is the next tab: the frame's own tab action takes the app there.
  const going: Cmd<FunMsg | FrameScopedMsg>[] = [(emit) => { emit(wrapFrameMsg({ type: 'next-tab' })); return undefined; }];
  return {
    id: 'home',
    title: 'Home',
    // `h` hides a demo's own card or panel, so the page shows the picture alone.
    init: () => [{ kind: 'home', background: background.mount(seed).update({ type: 'key', key: 'h' }), wordmark: true }, []],
    update(msg, model) {
      if (model.kind !== 'home') return [model, []];
      if (isPulseMsg(msg)) return [{ ...model, background: model.background.update({ type: 'pulse', dt: msg.dt }) }, []];
      if (msg.type === 'open') return [model, going];
      if (msg.type === 'toggle-wordmark') return [{ ...model, wordmark: !model.wordmark }, []];
      // `space` pauses and resumes a demo session.
      if (msg.type === 'toggle-motion') return [{ ...model, background: model.background.update({ type: 'key', key: 'space' }) }, []];
      return [model, []];
    },
    keyMap: createKeyMap<FunMsg>()
      .bind('enter', 'Open the demos', { type: 'open' })
      .bind('w', 'Show or hide the wordmark', { type: 'toggle-wordmark' })
      .bind('m', 'Pause or resume the motion', { type: 'toggle-motion' }),
    layout: (model) => ({
      kind: 'pane', paneId: 'home',
      render: (width, height) => (model.kind === 'home' ? landingPicture(model, width, height, ctx) : createSurface(width, height)),
    }),
  };
}

/** The F2 settings: show the wordmark, run the motion, open the demos. */
export function landingSettings({ pageModel }: { readonly pageModel: LandingModel }): FrameSettings<FunMsg> {
  return {
    title: 'Settings',
    sections: [{
      id: 'display',
      title: 'Display',
      rows: [
        { id: 'wordmark', label: 'Wordmark', kind: 'toggle', checked: pageModel.wordmark, action: { type: 'toggle-wordmark' } },
        { id: 'motion', label: 'Motion', kind: 'toggle', checked: !pageModel.background.paused, action: { type: 'toggle-motion' } },
        { id: 'open', label: 'Open the demos', kind: 'action', action: { type: 'open' } },
      ],
    }],
  };
}

