import type { BijouCanvasFallbackReason } from './canvas-contract.js';

/** Stable codes of {@link BijouCanvasError}. */
export type BijouCanvasErrorCode =
  | 'BIJOU_WEB_CANVAS_NO_BACKEND'
  | 'BIJOU_WEB_CANVAS_NO_FACTORY'
  | 'BIJOU_WEB_CANVAS_UNPACKED_SURFACE'
  | 'BIJOU_WEB_CANVAS_ABORTED'
  | 'BIJOU_WEB_CANVAS_STOPPED'
  | 'BIJOU_WEB_CANVAS_NO_RESIZE_OBSERVER'
  | 'BIJOU_WEB_CANVAS_NO_TEXTAREA'
  | 'BIJOU_WEB_CANVAS_NOT_INTERACTIVE';

/**
 * The `code` Geordi's `BackendUnavailableError` carries. The default
 * unavailability predicate compares it; bijou-web imports nothing from Geordi.
 */
export const GPU_BACKEND_UNAVAILABLE_CODE = 'GEORDI_E_BIJOU_BACKEND_UNAVAILABLE';

/** A refusal by `mountBijouCanvas()` itself, as opposed to one from a presenter. */
export class BijouCanvasError extends Error {
  /** Stable machine-readable code. */
  readonly code: BijouCanvasErrorCode;
  /** For `BIJOU_WEB_CANVAS_NO_BACKEND`: why each backend was passed over. */
  readonly fallbackReasons: readonly BijouCanvasFallbackReason[];

  constructor(code: BijouCanvasErrorCode, message: string, fallbackReasons: readonly BijouCanvasFallbackReason[] = []) {
    super(`${code}: ${message}`);
    this.name = 'BijouCanvasError';
    this.code = code;
    this.fallbackReasons = fallbackReasons;
  }
}

function stringField(error: unknown, field: string): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const value: unknown = Reflect.get(error, field);
  return typeof value === 'string' ? value : undefined;
}

/** The default predicate: the error carries Geordi's unavailability code. */
export function isGpuBackendUnavailable(error: unknown): boolean {
  return stringField(error, 'code') === GPU_BACKEND_UNAVAILABLE_CODE;
}

/** The `code` of an error, or `'UNKNOWN'`. */
export function errorCode(error: unknown): string {
  return stringField(error, 'code') ?? 'UNKNOWN';
}

/** The `reason` or `detail` of an error, else its message. */
export function errorReason(error: unknown): string {
  return stringField(error, 'reason') ?? stringField(error, 'detail') ?? stringField(error, 'message') ?? String(error);
}

/** The error `stop()` and an aborted signal reject a pending attempt with. */
export function abortedError(): BijouCanvasError {
  return new BijouCanvasError('BIJOU_WEB_CANVAS_ABORTED', 'the mount was stopped or aborted before the presenter was ready');
}
