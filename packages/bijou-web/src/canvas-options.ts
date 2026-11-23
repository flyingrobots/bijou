import type { BijouContext, OutputMode } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import type {
  BijouCanvasBackend, BijouCanvasBackendChoice, BijouCanvasElement,
  BijouCanvasFallbackReason, BijouCanvasHost, BijouCanvasPresenters, BijouCanvasTextarea,
} from './canvas-contract.js';
import type { WebClock } from './clock.js';
import type { CreateWebContextOptions } from './context.js';
import type { WebInteractiveContext } from './context-interactive.js';
import type { WebInteractiveIOOptions } from './interactive-io.js';
import type { WebCell } from './pointer.js';

/** An `AbortSignal`, as far as the mount reads one. */
export interface BijouCanvasAbortSignal {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

/** Options for `mountBijouCanvas()`. `C` is the page's canvas type. */
export interface MountBijouCanvasOptions<C extends BijouCanvasElement> {
  /** Presenter factories. Each receives a fresh canvas from `createCanvas`. */
  readonly presenters: BijouCanvasPresenters<C>;
  /**
   * Creates one `<canvas>`, such as `() => document.createElement('canvas')`.
   * The mount calls it for every attempt and every switch, and adds and
   * removes the canvas itself. Its return type is what the factories receive.
   */
  readonly createCanvas: () => C;
  /** Physical pixels per cell, such as the glyph atlas's `cellPxW` and `cellPxH`. */
  readonly cellPx: { readonly width: number; readonly height: number };
  /** `'auto'` (the default) walks `webgpu`, `webgl2`, `canvas2d`; a name forces one. */
  readonly backend?: BijouCanvasBackendChoice;
  /** Creates the hidden textarea. Defaults to `container.ownerDocument.createElement('textarea')`. */
  readonly createTextarea?: () => BijouCanvasTextarea;
  /**
   * Tells a backend's unavailability from a renderer fault. Defaults to
   * `code === 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE'`.
   */
  readonly isBackendUnavailable?: (error: unknown) => boolean;
  /** Resize and DPR sources. Defaults to `ResizeObserver`, `devicePixelRatio` and `matchMedia`. */
  readonly host?: BijouCanvasHost;
  /** Clock for the runtime and frame scheduling. Defaults to `createWebClock()`. */
  readonly clock?: WebClock;
  /** Output mode. Any mode but `interactive` writes text to the output sinks and mounts no canvas. */
  readonly mode?: OutputMode;
  /** Theme, environment and output sinks of the context. */
  readonly context?: Omit<CreateWebContextOptions, 'clock' | 'mode'>;
  /** Shortcut pass-through and paste policy of the input adapter. */
  readonly input?: Pick<WebInteractiveIOOptions, 'platform' | 'passThrough' | 'onPasteRejected'>;
  /** Abort a mount that has not resolved yet. */
  readonly signal?: BijouCanvasAbortSignal;
  /** A BCSS stylesheet for the run, as `RunOptions.css`. */
  readonly css?: string;
}

/**
 * The app to mount, or a function that builds it from the context it runs
 * with. The function is called once, before `init()`, with the run's context;
 * in `interactive` mode its runtime already has the mounted grid.
 */
export type BijouCanvasApp<Model> = App<Model, unknown> | ((ctx: BijouContext) => App<Model, unknown>);

/** A running canvas mount. */
export interface MountedBijouCanvas<Model, C extends BijouCanvasElement> {
  /** The backend presenting now; `null` outside `interactive` mode. */
  readonly backend: BijouCanvasBackend | null;
  /** Why the first mount passed over each earlier backend. */
  readonly fallbackReasons: readonly BijouCanvasFallbackReason[];
  /** The canvas presenting now; `null` outside `interactive` mode. */
  readonly canvas: C | null;
  /** The hidden textarea; `null` outside `interactive` mode. */
  readonly textarea: BijouCanvasTextarea | null;
  /** The context the app runs with. */
  readonly ctx: WebInteractiveContext;
  /** Settles when the run ends: resolves on `stop()` or app quit, rejects on a fault. */
  readonly done: Promise<void>;
  /** The app's latest model. */
  model(): Model;
  /** The 0-based cell under a client point. */
  cellFromPoint(clientX: number, clientY: number): WebCell;
  /**
   * Move to `next` on a fresh canvas. The run, its model and the textarea
   * stay; the old canvas and presenter go only once the new one is ready.
   * Rejects, and keeps the current backend, when `next` cannot start.
   */
  switchBackend(next: BijouCanvasBackend): Promise<void>;
  /** End the run and remove everything the mount added. Safe to call again. */
  stop(): Promise<void>;
}
