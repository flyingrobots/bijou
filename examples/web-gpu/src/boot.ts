import type { BijouCanvasBackend, BijouCanvasBackendChoice } from '@flyingrobots/bijou-web';
import { createShowcaseAtlas } from './atlas.js';
import { createShowcasePresenters } from './presenters.js';
import { installProbe } from './probe.js';
import { describeProblem } from './problems.js';
import { createShowcaseSession, type ShowcaseSession } from './session.js';
import type { ShowcaseStore } from './showcase-store.js';

export const BACKENDS: readonly BijouCanvasBackend[] = ['webgpu', 'webgl2', 'canvas2d'];
export const BACKEND_LABELS: Record<BijouCanvasBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', canvas2d: 'Canvas 2D' };

/** `?app=counter&backend=webgl2` choose the first mount; both default as shown. */
function initialChoice(): { readonly app: string; readonly backend: BijouCanvasBackendChoice } {
  const params = new URLSearchParams(window.location.search);
  const app = params.get('app') ?? 'counter';
  const requested = params.get('backend');
  const backend = BACKENDS.find((name) => name === requested) ?? 'auto';
  return { app, backend };
}

async function start(container: HTMLElement, store: ShowcaseStore): Promise<void> {
  const late: { session?: ShowcaseSession } = {};
  // A new device pixel ratio changes the cell size, which a mount fixes: mount again.
  const atlas = createShowcaseAtlas(() => { void late.session?.remount(); });
  const presenters = createShowcasePresenters(atlas.atlas);
  const session = createShowcaseSession(container, atlas, presenters);
  late.session = session;
  store.update({ session });
  installProbe(session);
  const choice = initialChoice();
  await session.mountApp(choice.app, choice.backend);
  const refresh = async (): Promise<void> => {
    store.update({ hud: await session.state() });
  };
  await refresh();
  // A failed refresh is shown, not left as an unhandled rejection; the next one clears it.
  window.setInterval(() => {
    refresh().then(() => {
      if (store.snapshot().error !== null) store.update({ error: null });
    }, (error: unknown) => { store.update({ error: `HUD refresh: ${describeProblem(error)}` }); });
  }, 200);
}

/** Start the showcase on the Surface container the chrome rendered. */
export function bootShowcase(container: HTMLElement, store: ShowcaseStore): void {
  start(container, store).catch((error: unknown) => {
    window.__bijouWebGpuError = describeProblem(error);
    store.update({ error: window.__bijouWebGpuError });
  });
}
