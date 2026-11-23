/**
 * Browser host adapter for Bijou.
 *
 * Implements the clock, runtime, style, and output I/O ports with no
 * dependencies and no Node.js imports, and composes them into a
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
export { createWebContext } from './context.js';
export type { CreateWebContextOptions, WebContext } from './context.js';
export { WEB_UNSUPPORTED_CAPABILITY, WebUnsupportedCapabilityError } from './errors.js';
export type { WebUnsupportedCapability } from './errors.js';
export { mountBijouDom } from './dom-mount.js';
export type {
  BijouDomDirection, BijouDomDocument, BijouDomElement, BijouDomEvent, BijouDomHandle,
  BijouDomNode, BijouDomStyle, BijouDomText, MountBijouDomOptions,
} from './dom-contract.js';
