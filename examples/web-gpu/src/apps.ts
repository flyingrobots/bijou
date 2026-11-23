import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import { startedApp } from './browser-start-app.js';

export { REFUSED_APPS, type RefusedApp } from './refused-apps.js';

/** An example app the showcase mounts as it is. */
export interface ShowcaseApp {
  readonly id: string;
  readonly title: string;
  /** Builds the app from the run's context. */
  load(): Promise<(ctx: BijouContext) => App<unknown, unknown>>;
}

export const SHOWCASE_APPS: readonly ShowcaseApp[] = [
  {
    id: 'counter',
    title: 'Counter',
    // examples/counter/main.ts runs as it is; its startApp() call hands the app over.
    async load() {
      await import('../../counter/main.js');
      return startedApp()((app) => () => app);
    },
  },
  {
    id: 'showcase',
    title: 'Component showcase',
    async load() {
      const { createShowcaseApp } = await import('../../showcase/app.js');
      return (ctx) => createShowcaseApp(ctx);
    },
  },
];
