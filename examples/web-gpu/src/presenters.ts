import {
  createCanvas2DSurfacePresenter, createWebGL2SurfacePresenter, createWebGPUSurfacePresenter,
  type EndpointReceipt, type GlyphAtlas, type GpuSurfacePresenter, type WebGL2SurfacePresenter,
  type WebGpuSurfacePresenter,
} from '@flyingrobots/geordi-bijou-gpu';
import type { BijouCanvasBackend, BijouCanvasPresenter, BijouCanvasPresenters } from '@flyingrobots/bijou-web';

/** The theme defaults every presenter paints unset colours with. */
export const SHOWCASE_DEFAULT_FG = '#E6EDF3';
export const SHOWCASE_DEFAULT_BG = '#0D1117';

/** A presenter the page created, with what the HUD reads from it. */
export interface TrackedPresenter {
  readonly backend: BijouCanvasBackend;
  readonly canvas: HTMLCanvasElement;
  readonly inner: GpuSurfacePresenter;
  /** Milliseconds the last `present()` call took, measured around the call. */
  lastPresentMs: number | null;
  presents: number;
  /** The newest receipt; WebGPU reads its frame back first, so this is async. */
  receipt(): Promise<EndpointReceipt | null>;
}

function isWebGpu(backend: BijouCanvasBackend, inner: GpuSurfacePresenter): inner is WebGpuSurfacePresenter {
  return backend === 'webgpu' && 'captureFrame' in inner;
}

/** Wrap a Geordi presenter so the page can time `present()` and read receipts. */
function track(backend: BijouCanvasBackend, canvas: HTMLCanvasElement, inner: GpuSurfacePresenter, live: Map<HTMLCanvasElement, TrackedPresenter>): BijouCanvasPresenter {
  const tracked: TrackedPresenter = {
    backend, canvas, inner, lastPresentMs: null, presents: 0,
    async receipt() {
      if (isWebGpu(backend, inner)) return tracked.presents === 0 ? null : (await inner.captureFrame()).receipt;
      return inner.getLastReceipt();
    },
  };
  live.set(canvas, tracked);
  return {
    present(current, target, ctx) {
      const start = performance.now();
      inner.present(current, target, ctx);
      tracked.lastPresentMs = performance.now() - start;
      tracked.presents += 1;
    },
    resize: (size) => { inner.resize(size); },
    dispose() {
      live.delete(canvas);
      inner.dispose();
    },
  };
}

/** The three factories `mountBijouCanvas()` negotiates, and the presenters they made. */
export interface ShowcasePresenters {
  readonly factories: BijouCanvasPresenters<HTMLCanvasElement>;
  presenterFor(canvas: HTMLCanvasElement | null): TrackedPresenter | undefined;
  /** The WebGL2 presenter on `canvas`, for its diagnostics. */
  webgl2(canvas: HTMLCanvasElement | null): WebGL2SurfacePresenter | undefined;
}

/**
 * Geordi's factories as Bijou's structural presenter contract wants them.
 * WebGL2 reads every canonical frame back, so its receipts are probed
 * (`gpu-probed` or `software-probed`) rather than `unit-upload`.
 */
export function createShowcasePresenters(atlas: GlyphAtlas): ShowcasePresenters {
  const live = new Map<HTMLCanvasElement, TrackedPresenter>();
  const colours = { defaultFg: SHOWCASE_DEFAULT_FG, defaultBg: SHOWCASE_DEFAULT_BG };
  // Weak: a removed canvas and its disposed presenter are not kept alive by the lookup.
  const webgl2 = new WeakMap<HTMLCanvasElement, WebGL2SurfacePresenter>();
  return {
    factories: {
      webgpu: async (canvas) => track('webgpu', canvas, await createWebGPUSurfacePresenter(canvas, { atlas, ...colours }), live),
      webgl2: (canvas) => {
        const presenter = createWebGL2SurfacePresenter({ canvas, atlas, ...colours, canonicalReadback: true });
        webgl2.set(canvas, presenter);
        return track('webgl2', canvas, presenter, live);
      },
      canvas2d: (canvas) => track('canvas2d', canvas, createCanvas2DSurfacePresenter({
        canvas, atlas, ...colours, dpr: window.devicePixelRatio,
      }), live),
    },
    presenterFor: (canvas) => (canvas === null ? undefined : live.get(canvas)),
    webgl2: (canvas) => (canvas === null || !live.has(canvas) ? undefined : webgl2.get(canvas)),
  };
}
