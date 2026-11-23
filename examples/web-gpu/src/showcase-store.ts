import type { HudState } from './hud.js';
import type { ShowcaseSession } from './session.js';

/** What the chrome renders: the session once it exists, the latest HUD state, and any problem to show. */
export interface ShowcaseView {
  readonly session: ShowcaseSession | null;
  readonly hud: HudState | null;
  /** A boot failure or a failed HUD refresh, as `CODE: message`; null while healthy. */
  readonly error: string | null;
  /** Operations the chrome started that have not settled yet. */
  readonly busy: number;
}

/** The port between the page's session and its React chrome, read with `useSyncExternalStore`. */
export interface ShowcaseStore {
  readonly subscribe: (listener: () => void) => () => void;
  readonly snapshot: () => ShowcaseView;
  readonly update: (patch: Partial<ShowcaseView>) => void;
  /** Run one session operation, counted in `busy` until it settles. */
  readonly run: (operation: (session: ShowcaseSession) => Promise<void>) => void;
}

export function createShowcaseStore(): ShowcaseStore {
  let view: ShowcaseView = { session: null, hud: null, error: null, busy: 0 };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<ShowcaseView>): void => {
    view = { ...view, ...patch };
    for (const listener of listeners) listener();
  };
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    snapshot: () => view,
    update,
    run: (operation) => {
      const session = view.session;
      if (session === null) return;
      update({ busy: view.busy + 1 });
      // The session records a failed operation itself; the chrome only counts it.
      void operation(session).finally(() => { update({ busy: view.busy - 1 }); });
    },
  };
}
