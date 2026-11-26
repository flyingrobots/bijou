// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { BrowsableListState, SplitPaneState } from '@flyingrobots/bijou-tui';
import type { Session } from './contract.js';

/** The Home page: a demo running behind the Bijou wordmark. */
export interface LandingModel {
  readonly kind: 'home';
  /** The background demo. It hears pulses, never the pointer or the keys. */
  readonly background: Session;
  readonly wordmark: boolean;
}

/** The Demos page: the list, the selected demo running, and whether it is playing full-pane. */
export interface DemosModel {
  readonly kind: 'demos';
  readonly list: BrowsableListState<number>;
  readonly split: SplitPaneState;
  readonly session: Session;
  readonly playing: boolean;
  /** The pane the running demo was last told about, so a pulse can tell it a new size. */
  readonly pane: { readonly width: number; readonly height: number };
}

/** Every page model of the fun app: the frame holds one model type, so pages tell theirs apart by `kind`. */
export type FunModel = LandingModel | DemosModel;

export type LandingMsg = { readonly type: 'open' } | { readonly type: 'toggle-wordmark' } | { readonly type: 'toggle-motion' };

export type DemosMsg =
  | { readonly type: 'demos-next' } | { readonly type: 'demos-prev' } | { readonly type: 'demos-play' }
  | { readonly type: 'demos-stop' } | { readonly type: 'demos-key'; readonly key: string } | { readonly type: 'demos-panel' }
  | { readonly type: 'demos-pointer'; readonly col: number; readonly row: number };

export type FunMsg = LandingMsg | DemosMsg;
