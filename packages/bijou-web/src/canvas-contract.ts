import type { WebPointerSurface, WebTextareaLike } from './web-dom.js';

/**
 * Structural contract between `mountBijouCanvas()`, the page, and the
 * presenters it is given. Nothing here names a DOM, GPU or Geordi type: a
 * page passes its real elements, a host passes Geordi's factories, and a test
 * passes in-memory fakes.
 */

/** A presenter backend, in the order `'auto'` tries them. */
export type BijouCanvasBackend = 'webgpu' | 'webgl2' | 'canvas2d';

/** `'auto'` walks the ladder; a backend name forces that backend alone. */
export type BijouCanvasBackendChoice = 'auto' | BijouCanvasBackend;

/** Every backend in ladder order. */
export const BIJOU_CANVAS_LADDER: readonly BijouCanvasBackend[] = ['webgpu', 'webgl2', 'canvas2d'];

/**
 * One frame as a presenter receives it: a copy of a packed Surface's
 * storage. It is structurally Geordi's `GpuPackedSurface`.
 */
export interface BijouCanvasFrame {
  /** Width in cells. */
  readonly width: number;
  /** Height in cells. */
  readonly height: number;
  /** `CELL_STRIDE`-byte packed cells in row-major order. */
  readonly buffer: Uint8Array;
  /** Multi-codepoint graphemes that packed cells reference. */
  readonly sideTable: readonly string[];
  /** One damage bit per cell. */
  readonly renderDirtyWords: Uint32Array;
}

/** Per-frame flags. */
export interface BijouCanvasPresentContext {
  /** Set on the first frame of a presenter and after a grid change. */
  readonly forceFullRefresh?: boolean;
}

/** The CSS box and device pixel ratio a presenter sizes its canvas from. */
export interface BijouCanvasResize {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly dpr: number;
  /** The exact device-pixel content box, when the host observed one. */
  readonly devicePixelContentBox?: { readonly width: number; readonly height: number };
}

/**
 * What the mount calls on a presenter. Geordi's `GpuSurfacePresenter`
 * satisfies it as it is.
 */
export interface BijouCanvasPresenter {
  /**
   * Draw `target`. The union of both frames' `renderDirtyWords` is the
   * damage; `current` is the frame this presenter showed last. Synchronous:
   * the mount reuses both frames after this returns.
   */
  present(current: BijouCanvasFrame, target: BijouCanvasFrame, ctx: BijouCanvasPresentContext): void;
  /** Size the canvas for a new box or device pixel ratio. */
  resize(size: BijouCanvasResize): void;
  /** Release every resource. Called once. */
  dispose(): void;
}

/** Read by a factory that can stop early. Set once `stop()` or the mount signal fires. */
export interface BijouCanvasAbortToken {
  readonly aborted: boolean;
}

/** What a factory is told besides the canvas. */
export interface BijouCanvasPresenterInit {
  readonly backend: BijouCanvasBackend;
  readonly signal: BijouCanvasAbortToken;
}

/**
 * Creates a presenter on a fresh canvas, synchronously or by promise. An
 * unavailable backend throws or rejects with an error the unavailability
 * predicate recognises; any other error is a renderer fault.
 */
export type BijouCanvasPresenterFactory<C> = (
  canvas: C,
  init: BijouCanvasPresenterInit,
) => BijouCanvasPresenter | Promise<BijouCanvasPresenter>;

/** Injected factories, one per backend. A missing one is skipped by `'auto'`. */
export type BijouCanvasPresenters<C> = Readonly<Partial<Record<BijouCanvasBackend, BijouCanvasPresenterFactory<C>>>>;

/** Why `'auto'` passed over a backend. */
export interface BijouCanvasFallbackReason {
  readonly backend: BijouCanvasBackend;
  /** The error's `code`, or `BIJOU_WEB_CANVAS_NO_FACTORY`. */
  readonly code: string;
  /** The error's `reason`, `detail` or message. */
  readonly reason: string;
}

/** A DOM node, as far as the mount needs one. */
export interface BijouCanvasNode {
  readonly parentNode: BijouCanvasNode | null;
}

/** A `<canvas>`: the mount adds and removes it and routes pointer input from it. */
export interface BijouCanvasElement extends BijouCanvasNode, WebPointerSurface {
  width: number;
  height: number;
}

/** The hidden `<textarea>` that takes keyboard, IME and paste input. */
export interface BijouCanvasTextarea extends BijouCanvasNode, WebTextareaLike {
  focus(): void;
}

/** The document that creates the default textarea and reports focus. */
export interface BijouCanvasDocument {
  createElement(tag: string): BijouCanvasNode;
  readonly activeElement?: unknown;
}

/** The element the mount owns children in. */
export interface BijouCanvasContainer extends BijouCanvasNode {
  readonly ownerDocument?: BijouCanvasDocument | null;
  appendChild(node: BijouCanvasNode): unknown;
  removeChild(node: BijouCanvasNode): unknown;
}

/** A content box from a resize observation. */
export interface BijouCanvasBox {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly devicePixelContentBox?: { readonly width: number; readonly height: number };
}

/** Resize and device-pixel-ratio sources. The default reads the browser globals. */
export interface BijouCanvasHost {
  /** Observe `target`'s content box. @returns A function that stops observing. */
  observeResize(target: BijouCanvasContainer, onBox: (box: BijouCanvasBox) => void): () => void;
  devicePixelRatio(): number;
  /** Call `onChange` when the ratio changes. @returns A function that stops watching. */
  watchDevicePixelRatio(onChange: () => void): () => void;
}
