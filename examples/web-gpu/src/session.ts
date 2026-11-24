import type { BijouCanvasBackend, BijouCanvasBackendChoice, MountedBijouCanvas } from '@flyingrobots/bijou-web';
import { SHOWCASE_APPS, type ShowcaseBuild } from './apps.js';
import type { ShowcaseAtlas } from './atlas.js';
import type { ShowcaseHost } from './handoff.js';
import { mountInDom, mountOnCanvas, type Carried, type LiveMount } from './host-mounts.js';
import { hostNote, type HudState } from './hud.js';
import { describeProblem, until } from './problems.js';
import type { ShowcasePresenters } from './presenters.js';
import { readState } from './session-state.js';

/** One mounted app at a time, and every operation the HUD controls run on it. */
export interface ShowcaseSession {
  state(): Promise<HudState>;
  mountApp(id: string, backend?: BijouCanvasBackendChoice): Promise<void>;
  switchBackend(next: BijouCanvasBackend): Promise<void>;
  /** Stop the mount and present the same app, with its model, on the other host. */
  switchHost(next: ShowcaseHost): Promise<void>;
  /** Lose the WebGL2 context with `WEBGL_lose_context`, then restore it. */
  loseContext(): Promise<void>;
  resetAtlas(): Promise<void>;
  /** Mount the current app again on the current backend, as after a cell size change. */
  remount(): Promise<void>;
  /** Stop the mounted app; the mount removes its canvas and textarea. */
  unmount(): Promise<void>;
  /** The latest model of the mounted app. */
  model(): unknown;
  /** Every operation that failed, oldest first; a later mount does not clear it. */
  failures(): readonly string[];
  /** The physical cell size the current mount was created with. */
  cellPx(): { readonly width: number; readonly height: number };
  readonly handle: () => MountedBijouCanvas<unknown, HTMLCanvasElement> | undefined;
}

export function createShowcaseSession(container: HTMLElement, atlas: ShowcaseAtlas, presenters: ShowcasePresenters): ShowcaseSession {
  let live: LiveMount | undefined;
  let built: ShowcaseBuild | undefined;
  let title: string | null = null;
  // The backend the canvas host last presented on, so a round trip through the DOM host returns to it.
  let lastBackend: BijouCanvasBackendChoice = 'auto';
  const handle = (): MountedBijouCanvas<unknown, HTMLCanvasElement> | undefined => live?.canvas;
  // The cell size and ratio the mount was made with: the atlas may already have newer ones.
  let metrics = { cellPx: atlas.cellPx(), dpr: atlas.dpr() };
  let appId: string | null = null;
  let problem: string | null = null;
  const failures: string[] = [];
  // Operations run one at a time, in the order the controls were used.
  let queue: Promise<void> = Promise.resolve();
  const enqueue = (work: () => Promise<void>): Promise<void> => {
    const step = queue.then(work).catch((error: unknown) => {
      problem = describeProblem(error);
      failures.push(problem);
    });
    queue = step;
    return step;
  };
  const webgl2 = () => presenters.webgl2(handle()?.canvas ?? null);

  /** Start `host` for the loaded app; one mount at a time, so the caller has stopped the last one. */
  async function start(host: ShowcaseHost, backend: BijouCanvasBackendChoice, carried?: Carried): Promise<void> {
    if (built === undefined) throw new Error('BIJOU_WEB_GPU_NOT_MOUNTED: no app is mounted');
    if (host === 'dom') {
      live = mountInDom(container, built, carried);
      return;
    }
    const made = { cellPx: atlas.cellPx(), dpr: atlas.dpr() };
    const next = await mountOnCanvas(container, atlas, presenters, built, backend, carried);
    live = next;
    metrics = made;
    next.canvas?.done.catch((error: unknown) => { if (live === next) problem = describeProblem(error); });
  }

  async function mount(id: string, backend: BijouCanvasBackendChoice): Promise<void> {
    await live?.stop();
    live = undefined;
    appId = id;
    problem = null;
    const entry = SHOWCASE_APPS.find((app) => app.id === id);
    if (entry === undefined) throw new Error(`BIJOU_WEB_GPU_UNKNOWN_APP: ${id}`);
    title = entry.title;
    built = await entry.load();
    await start('canvas', backend);
  }

  async function toHost(next: ShowcaseHost): Promise<void> {
    const from = live;
    if (from === undefined || built === undefined) throw new Error('BIJOU_WEB_GPU_NOT_MOUNTED: no app is mounted');
    if (next === from.host) return;
    if (next === 'dom' && built.scene === undefined) throw new Error(`BIJOU_WEB_GPU_NO_SCENE: ${hostNote({ appTitle: title, sceneApp: false }) ?? ''}`);
    const carried: Carried = { model: from.model() };
    if (from.canvas?.backend != null) lastBackend = from.canvas.backend;
    await from.stop();
    live = undefined;
    try {
      await start(next, lastBackend, carried);
    } catch (error: unknown) {
      // The new host could not start: bring the previous one back with the same model.
      await start(from.host, lastBackend, carried);
      throw error;
    }
  }

  return {
    handle,
    model: () => live?.model(),
    failures: () => [...failures],
    cellPx: () => metrics.cellPx,
    mountApp: (id, backend = 'auto') => enqueue(() => mount(id, backend)),
    switchBackend: (next) => enqueue(async () => {
      const canvas = handle();
      if (canvas === undefined) throw new Error('BIJOU_WEB_GPU_NOT_ON_CANVAS: no app is mounted on the canvas host');
      await canvas.switchBackend(next);
    }),
    switchHost: (next) => enqueue(() => toHost(next)),
    loseContext: () => enqueue(async () => {
      const gl = handle()?.canvas?.getContext('webgl2');
      const lose = gl?.getExtension('WEBGL_lose_context');
      if (lose == null) throw new Error('BIJOU_WEB_GPU_NO_CONTEXT_LOSS: the current backend is not WebGL2');
      lose.loseContext();
      await until(() => webgl2()?.getDiagnostics().contextLost === true);
      lose.restoreContext();
      await until(() => webgl2()?.getDiagnostics().contextLost === false);
    }),
    // The DOM host has no cell size, so a new device pixel ratio does not concern it.
    remount: () => enqueue(() => (appId === null || live?.host !== 'canvas' ? Promise.resolve() : mount(appId, handle()?.backend ?? 'auto'))),
    unmount: () => enqueue(async () => {
      await live?.stop();
      live = undefined;
      built = undefined;
      appId = null;
      title = null;
    }),
    resetAtlas: () => enqueue(() => { atlas.reset(); return Promise.resolve(); }),
    state: () => readState({
      container, presenters, live, metrics, problem, app: appId, appTitle: title,
      sceneApp: built?.scene !== undefined, contextLost: webgl2()?.getDiagnostics().contextLost ?? false,
    }),
  };
}
