// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The fun app: one framed Bijou app holding every demo. Home shows a demo behind
// the Bijou wordmark; Demos lists every demo beside the selected one running and
// plays it full-pane. The frame brings tabs, key hints, ? help, F2 settings, the
// command palette and q to quit.
import type { BijouContext } from '@flyingrobots/bijou';
import { createFramedApp, type FrameSettings } from '@flyingrobots/bijou-tui';
import type { DemoEntry } from './contract.js';
import { demosPage } from './demos-page.js';
import type { FunModel, FunMsg } from './fun-app-types.js';
import { landingPage, landingSettings } from './landing.js';

export interface FunAppOptions {
  readonly ctx: BijouContext;
  /** Every demo, in the order the Demos page lists them. */
  readonly entries: readonly DemoEntry[];
  readonly seed: number;
  /** Debug mode: halt with a dialog when a page has key bindings that can never fire. */
  readonly debug?: boolean;
}

/** The F2 settings of whichever page is showing. */
export function funSettings({ pageModel }: { readonly pageModel: FunModel }): FrameSettings<FunMsg> {
  if (pageModel.kind === 'home') return landingSettings({ pageModel });
  return {
    title: 'Settings',
    sections: [{
      id: 'demo',
      title: 'Demo',
      rows: [
        { id: 'play', label: pageModel.playing ? 'Back to the list' : 'Play full-pane', kind: 'action', action: { type: pageModel.playing ? 'demos-stop' : 'demos-play' } },
        { id: 'panel', label: 'Show or hide the demo\'s panel', kind: 'action', action: { type: 'demos-panel' } },
      ],
    }],
  };
}

/** The demo behind the Home page's wordmark: the 3D wave surface, or the first demo if the catalog lacks it. */
const HOME_BACKGROUND = 'wave-surface';

export function createFunApp({ ctx, entries, seed, debug = false }: FunAppOptions) {
  const background = entries.find((entry) => entry.id === HOME_BACKGROUND) ?? entries[0];
  if (background === undefined) throw new Error('the fun app needs at least one demo');
  return createFramedApp<FunModel, FunMsg>({
    ctx,
    title: 'Bijou',
    pages: [landingPage({ ctx, background, seed }), demosPage({ ctx, entries, seed })],
    settings: funSettings,
    enableCommandPalette: true,
    // The pages answer before the frame: the Demos list keeps j and k, and a focused demo pane keeps the demo's keys.
    keyPriority: 'page-first',
    debug,
  });
}
