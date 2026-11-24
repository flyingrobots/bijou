import type { BijouCanvasBackend } from '@flyingrobots/bijou-web';
import { SHOWCASE_APPS } from '../apps.js';
import { BACKEND_LABELS, BACKENDS } from '../boot.js';
import { HOST_LABELS, HOSTS, type ShowcaseHost } from '../handoff.js';
import type { ShowcaseStore } from '../showcase-store.js';
import { openPage, PAGES } from './pages.js';

export type Theme = 'light' | 'dark' | 'system';

/** One entry of the command palette. */
export interface ChromeCommand {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly run: () => void;
  /** The leader sequence that runs it too, like `Space` then `d`. */
  readonly keys?: readonly string[];
}

const THEMES: readonly (readonly [Theme, string])[] = [['light', 'Light theme'], ['dark', 'Dark theme'], ['system', 'System theme']];

export function pageCommands(setTheme: (theme: Theme) => void): readonly ChromeCommand[] {
  return [
    ...PAGES.map((page) => ({ id: `page:${page.id}`, group: 'Go to', label: page.label, run: () => { openPage(page); }, keys: ['Space', page.leader] })),
    ...THEMES.map(([theme, label]) => ({ id: `theme:${theme}`, group: 'Theme', label, run: () => { setTheme(theme); } })),
  ];
}

/** Switch host, unless the mounted app cannot take it: then there is nothing to ask the session for. */
export function switchHost(store: ShowcaseStore, host: ShowcaseHost): void {
  const hud = store.snapshot().hud;
  if (hud === null || hud.host === host || (host === 'dom' && !hud.sceneApp)) return;
  store.run((session) => session.switchHost(host));
}

/** The other host from the one presenting now. */
export function toggleHost(store: ShowcaseStore): void {
  switchHost(store, store.snapshot().hud?.host === 'dom' ? 'canvas' : 'dom');
}

/** The showcase's controls as commands: the same operations its buttons run. */
export function showcaseCommands(store: ShowcaseStore): readonly ChromeCommand[] {
  const backend = (name: BijouCanvasBackend): ChromeCommand => ({
    id: `backend:${name}`, group: 'Backend', label: BACKEND_LABELS[name],
    run: () => { store.run((session) => session.switchBackend(name)); },
  });
  return [
    ...SHOWCASE_APPS.map((app) => ({ id: `app:${app.id}`, group: 'App', label: app.title, run: () => { store.run((session) => session.mountApp(app.id)); } })),
    ...HOSTS.map((host) => ({ id: `host:${host}`, group: 'Host', label: HOST_LABELS[host], run: () => { switchHost(store, host); } })),
    ...BACKENDS.map(backend),
    { id: 'hostile:lose-context', group: 'Hostile events', label: 'Lose the WebGL2 context', run: () => { store.run((session) => session.loseContext()); } },
    { id: 'hostile:reset-atlas', group: 'Hostile events', label: 'Reset the glyph atlas', run: () => { store.run((session) => session.resetAtlas()); } },
  ];
}
