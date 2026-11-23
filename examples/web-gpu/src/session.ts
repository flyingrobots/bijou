import { setDefaultContext } from '@flyingrobots/bijou';
import { mountBijouCanvas, type BijouCanvasBackend, type BijouCanvasBackendChoice, type MountedBijouCanvas } from '@flyingrobots/bijou-web';
import { SHOWCASE_APPS } from './apps.js';
import type { ShowcaseAtlas } from './atlas.js';
import { receiptFields, type HudState } from './hud.js';
import { describeProblem, until } from './problems.js';
import type { ShowcasePresenters, TrackedPresenter } from './presenters.js';
import type { EndpointReceipt } from '@flyingrobots/geordi-bijou-gpu';

/** One mounted app at a time, and every operation the HUD controls run on it. */
export interface ShowcaseSession {
  state(): Promise<HudState>;
  mountApp(id: string, backend?: BijouCanvasBackendChoice): Promise<void>;
  switchBackend(next: BijouCanvasBackend): Promise<void>;
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

/**
 * The tracked presenter's newest receipt. A WebGPU readback rejects when a
 * switch disposes the presenter during it: that presenter is gone, so it has
 * no receipt to show. A failure of the presenter still presenting is thrown.
 */
async function readReceipt(tracked: TrackedPresenter | undefined, presenters: ShowcasePresenters): Promise<EndpointReceipt | null> {
  if (tracked === undefined) return null;
  try {
    return await tracked.receipt();
  } catch (error: unknown) {
    if (presenters.presenterFor(tracked.canvas) !== tracked) return null;
    throw error;
  }
}

export function createShowcaseSession(container: HTMLElement, atlas: ShowcaseAtlas, presenters: ShowcasePresenters): ShowcaseSession {
  let handle: MountedBijouCanvas<unknown, HTMLCanvasElement> | undefined;
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
  const webgl2 = () => presenters.webgl2(handle?.canvas ?? null);

  async function mount(id: string, backend: BijouCanvasBackendChoice): Promise<void> {
    await handle?.stop();
    handle = undefined;
    appId = id;
    problem = null;
    const entry = SHOWCASE_APPS.find((app) => app.id === id);
    if (entry === undefined) throw new Error(`BIJOU_WEB_GPU_UNKNOWN_APP: ${id}`);
    const { build, css } = await entry.load();
    const made = { cellPx: atlas.cellPx(), dpr: atlas.dpr() };
    const mounted = await mountBijouCanvas((ctx) => {
      // The browser counterpart of what startApp() does on Node.
      setDefaultContext(ctx);
      return build(ctx);
    }, container, {
      presenters: presenters.factories,
      createCanvas: () => document.createElement('canvas'),
      cellPx: made.cellPx,
      backend,
      ...(css === undefined ? {} : { css }),
    });
    handle = mounted;
    metrics = made;
    mounted.done.catch((error: unknown) => { if (handle === mounted) problem = describeProblem(error); });
  }

  return {
    handle: () => handle,
    model: () => handle?.model(),
    failures: () => [...failures],
    cellPx: () => metrics.cellPx,
    mountApp: (id, backend = 'auto') => enqueue(() => mount(id, backend)),
    switchBackend: (next) => enqueue(async () => {
      if (handle === undefined) throw new Error('BIJOU_WEB_GPU_NOT_MOUNTED: no app is mounted');
      await handle.switchBackend(next);
    }),
    loseContext: () => enqueue(async () => {
      const gl = handle?.canvas?.getContext('webgl2');
      const lose = gl?.getExtension('WEBGL_lose_context');
      if (lose == null) throw new Error('BIJOU_WEB_GPU_NO_CONTEXT_LOSS: the current backend is not WebGL2');
      lose.loseContext();
      await until(() => webgl2()?.getDiagnostics().contextLost === true);
      lose.restoreContext();
      await until(() => webgl2()?.getDiagnostics().contextLost === false);
    }),
    remount: () => enqueue(() => (appId === null ? Promise.resolve() : mount(appId, handle?.backend ?? 'auto'))),
    unmount: () => enqueue(async () => {
      await handle?.stop();
      handle = undefined;
      appId = null;
    }),
    resetAtlas: () => enqueue(() => { atlas.reset(); return Promise.resolve(); }),
    async state() {
      const tracked = presenters.presenterFor(handle?.canvas ?? null);
      const runtime = handle?.ctx.runtime;
      const { cellPx, dpr } = metrics;
      const receipt = await readReceipt(tracked, presenters);
      return {
        app: appId,
        backend: handle?.backend ?? null,
        fallbackReasons: handle?.fallbackReasons ?? [],
        grid: runtime === undefined ? null : { cols: runtime.columns, rows: runtime.rows },
        cellPx,
        dpr,
        frameMs: tracked?.lastPresentMs ?? null,
        presents: tracked?.presents ?? 0,
        ...receiptFields(receipt),
        contextLost: webgl2()?.getDiagnostics().contextLost ?? false,
        problem,
        canvases: container.querySelectorAll('canvas').length,
      };
    },
  };
}
