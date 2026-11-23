import type { App } from '@flyingrobots/bijou-tui';

/**
 * The browser stand-in for `startApp()` from `@flyingrobots/bijou-node`.
 *
 * The showcase's Vite build resolves `@flyingrobots/bijou-node` here, so an
 * example whose entry calls `startApp(app)` loads unmodified: the call hands
 * the app to the page instead of starting a terminal run, and resolves at
 * once. The page then mounts that app on a canvas. Nothing else of the Node
 * host exists in the browser; any other import from it fails the build.
 */
type StartedApp = <R>(use: <Model, M>(app: App<Model, M>) => R) => R;

let started: StartedApp | undefined;

export function startApp<Model, M>(app: App<Model, M>): Promise<void> {
  started = (use) => use(app);
  return Promise.resolve();
}

/** The app the last `startApp()` call handed over. */
export function startedApp(): StartedApp {
  if (started === undefined) throw new Error('BIJOU_WEB_GPU_NOT_STARTED: the entry never called startApp()');
  return started;
}
