import { setDefaultContext } from '@flyingrobots/bijou';
import {
  createWebContext, mountBijouCanvas, mountBijouDom,
  type BijouCanvasBackendChoice, type MountedBijouCanvas,
} from '@flyingrobots/bijou-web';
import type { ShowcaseBuild } from './apps.js';
import type { ShowcaseAtlas } from './atlas.js';
import { withCarriedModel, type ShowcaseHost } from './handoff.js';
import type { ShowcasePresenters } from './presenters.js';

/** The model a stopped host left, for the next host to start from. */
export interface Carried { readonly model: unknown }

/** The one mount alive on the page, whichever host made it. */
export interface LiveMount {
  readonly host: ShowcaseHost;
  /** The canvas mount's handle; absent on the DOM host. */
  readonly canvas?: MountedBijouCanvas<unknown, HTMLCanvasElement>;
  model(): unknown;
  /** End the run and remove everything the mount added to the container. */
  stop(): Promise<void>;
}

/** Present the app as cells on a canvas, starting from `carried` when a host handed a model on. */
export async function mountOnCanvas(
  container: HTMLElement, atlas: ShowcaseAtlas, presenters: ShowcasePresenters,
  built: ShowcaseBuild, backend: BijouCanvasBackendChoice, carried?: Carried,
): Promise<LiveMount> {
  const canvas = await mountBijouCanvas((ctx) => {
    // The browser counterpart of what startApp() does on Node.
    setDefaultContext(ctx);
    const app = built.build(ctx);
    return carried === undefined ? app : withCarriedModel(app, carried.model);
  }, container, {
    presenters: presenters.factories,
    createCanvas: () => document.createElement('canvas'),
    cellPx: atlas.cellPx(),
    backend,
    ...(built.css === undefined ? {} : { css: built.css }),
  });
  return { host: 'canvas', canvas, model: () => canvas.model(), stop: () => canvas.stop() };
}

/** Present the app's scene as native elements, starting from `carried` when a host handed a model on. */
export function mountInDom(container: HTMLElement, built: ShowcaseBuild, carried?: Carried): LiveMount {
  if (built.scene === undefined) throw new Error('BIJOU_WEB_GPU_NO_SCENE: the app has no scene projection');
  const ctx = createWebContext();
  const app = built.scene(ctx);
  // A real document and element, passed where mountBijouDom() takes its structural interfaces.
  const handle = mountBijouDom(carried === undefined ? app : withCarriedModel(app, carried.model), container, { document, ctx });
  return {
    host: 'dom',
    model: () => handle.controller.frame().model,
    stop: () => { handle.stop(); return Promise.resolve(); },
  };
}
