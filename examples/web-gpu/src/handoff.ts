import type { App, Cmd } from '@flyingrobots/bijou-tui';

/** Where the showcase presents an app: as cells on a canvas, or as native elements. */
export type ShowcaseHost = 'canvas' | 'dom';

export const HOSTS: readonly ShowcaseHost[] = ['canvas', 'dom'];
export const HOST_LABELS: Record<ShowcaseHost, string> = { canvas: 'Canvas', dom: 'DOM' };

export const isHost = (value: string): value is ShowcaseHost => HOSTS.some((host) => host === value);

/**
 * The app, unchanged but for `init()`, which returns the model a stopped host
 * left instead of a new one, and no commands.
 *
 * The app's own init commands are not run again: the first host already ran
 * them for this model, and running them a second time would repeat their
 * effects (a second fetch, a second timer). A command still pending when the
 * first host stopped ended with that host's bus; an app whose model depends on
 * one should carry what it needs in the model.
 */
export function withCarriedModel<A extends App<Model, M>, Model, M>(app: A, model: Model): A {
  const init = (): [Model, Cmd<M>[]] => [model, []];
  return { ...app, init };
}
