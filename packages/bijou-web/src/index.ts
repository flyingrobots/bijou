/**
 * Browser host adapter for Bijou.
 *
 * Implements the clock, runtime, style, output, and interactive input I/O
 * ports with no dependencies and no Node.js imports, and composes them into a
 * `BijouContext`.
 *
 * @module
 */
export { createWebClock } from './clock.js';
export type { WebCancel, WebClock, WebClockHost, WebClockOptions } from './clock.js';
export { createWebRuntime } from './runtime.js';
export type { WebRuntime, WebRuntimeOptions } from './runtime.js';
export { createWebStyle } from './style.js';
export type { WebStyleOptions } from './style.js';
export { createWebOutputIO } from './output-io.js';
export type { WebOutputIO, WebOutputIOOptions, WebOutputSinks } from './output-io.js';
export { createWebInteractiveIO } from './interactive-io.js';
export type { WebInteractiveIO, WebInteractiveIOOptions } from './interactive-io.js';
export type { WebCell, WebGridSize, WebMouseMsg } from './pointer.js';
export { createPassThrough } from './shortcuts.js';
export type { WebPassThrough, WebPlatform, WebShortcutEvent } from './shortcuts.js';
export type {
  WebClipboardData, WebEventTarget, WebListenerOptions, WebPointerEvent,
  WebPointerSurface, WebRect, WebTextEvent, WebTextareaLike,
} from './web-dom.js';
export { createWebContext } from './context.js';
export type { CreateWebContextOptions, WebContext } from './context.js';
export { WEB_UNSUPPORTED_CAPABILITY, WebUnsupportedCapabilityError } from './errors.js';
export type { WebUnsupportedCapability } from './errors.js';
