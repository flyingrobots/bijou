import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import { startedApp } from './browser-start-app.js';

export { REFUSED_APPS, type RefusedApp } from './refused-apps.js';

/** What the mount needs from an app: how to build it from the run's context, and its stylesheet. */
export interface ShowcaseBuild {
  readonly build: (ctx: BijouContext) => App<unknown, unknown>;
  /** A BCSS stylesheet, as the app's own entry passes to `run()`. */
  readonly css?: string;
}

/** An example app the showcase mounts as it is. */
export interface ShowcaseApp {
  readonly id: string;
  readonly title: string;
  load(): Promise<ShowcaseBuild>;
}

export const SHOWCASE_APPS: readonly ShowcaseApp[] = [
  {
    id: 'counter',
    title: 'Counter',
    // examples/counter/main.ts runs as it is; its startApp() call hands the app over.
    async load() {
      await import('../../counter/main.js');
      return { build: startedApp()((app) => () => app) };
    },
  },
  {
    id: 'components',
    title: 'Components library',
    // What examples/components/main.ts runs with no arguments.
    async load() {
      const { createLibraryApp, LIBRARY_CSS } = await import('../../components/library.js');
      return { build: (ctx) => createLibraryApp(ctx), css: LIBRARY_CSS };
    },
  },
  {
    id: 'hero',
    title: 'Hero',
    // What examples/hero/main.ts runs, with the browser adapter of the memory port.
    async load() {
      const [{ createHeroApp }, { createPerfTracker }, { browserMemory }] = await Promise.all([
        import('../../hero/app.js'), import('../../hero/perf.js'), import('../../hero/perf-browser.js'),
      ]);
      return {
        build: (ctx) => {
          const perf = createPerfTracker(browserMemory);
          const app = createHeroApp({ ctx, perf: perf.sample }, { cols: ctx.runtime.columns, rows: ctx.runtime.rows });
          const measured: typeof app = { ...app, view: (model) => perf.measure(() => app.view(model)) };
          return measured;
        },
      };
    },
  },
  {
    id: 'showcase',
    title: 'Component showcase',
    async load() {
      const { createShowcaseApp } = await import('../../showcase/app.js');
      return { build: (ctx) => createShowcaseApp(ctx) };
    },
  },
];
