import type { BijouContext } from '@flyingrobots/bijou';
import type { App, SemanticSceneApp } from '@flyingrobots/bijou-tui';
import { startedApp } from './browser-start-app.js';
import { GALLERY_DEMOS } from './gallery/demos.js';

export { REFUSED_APPS, type RefusedApp } from './refused-apps.js';

/** What the mount needs from an app: how to build it from the run's context, and its stylesheet. */
export interface ShowcaseBuild {
  readonly build: (ctx: BijouContext) => App<unknown, unknown>;
  /** A BCSS stylesheet, as the app's own entry passes to `run()`. */
  readonly css?: string;
  /** The app as a semantic scene app, when it has a scene projection: what the DOM host mounts. */
  readonly scene?: (ctx: BijouContext) => SemanticSceneApp<unknown, unknown>;
}

/** An example app the showcase mounts as it is. */
export interface ShowcaseApp {
  readonly id: string;
  readonly title: string;
  load(): Promise<ShowcaseBuild>;
}

export const SHOWCASE_APPS: readonly ShowcaseApp[] = [
  {
    id: 'landing',
    title: 'Landing',
    // The published site's front page: a fun demo chosen at random runs behind the wordmark and one card per demo.
    // The two font demos are left out of the draw: they wait on a font download before they can paint.
    async load() {
      const [{ createLandingApp }, { catalog }, { fetchFont }] = await Promise.all([
        import('../../fun/landing.js'), import('../../fun/registry.js'), import('../../fun/browser.js'),
      ]);
      const backgrounds = catalog.filter((item) => item.id !== 'font-renderer' && item.id !== 'text-cylinder');
      const pick = backgrounds[Math.floor(Math.random() * backgrounds.length)] ?? catalog[0];
      if (pick === undefined) throw new Error('BIJOU_WEB_GPU_NO_FUN_DEMOS');
      const background = await pick.load({ font: fetchFont });
      const cards = catalog.map(({ id, name, description }) => ({ id, name, description }));
      const open = (id: string): void => { window.location.assign(`./gallery.html?app=fun-${id}`); };
      return { build: (ctx) => createLandingApp({ ctx, cards, background, open, seed: Date.now() % 1_000_000 }) };
    },
  },
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
  // Every gallery demo (DOGFOOD first), so the showcase page and the gallery load them one way.
  ...GALLERY_DEMOS,
  {
    id: 'dual',
    title: 'Dual-host counter',
    // One app with both projections: cells for the canvas host, a scene for the DOM host.
    async load() {
      const { createDualApp } = await import('./dual/dual-app.js');
      return { build: (ctx) => createDualApp(ctx), scene: (ctx) => createDualApp(ctx) };
    },
  },
];
