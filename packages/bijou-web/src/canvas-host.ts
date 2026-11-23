import type { BijouCanvasBox, BijouCanvasContainer, BijouCanvasHost } from './canvas-contract.js';
import { BijouCanvasError } from './canvas-errors.js';

interface ObserverLike {
  observe(target: unknown, options?: { box: string }): void;
  disconnect(): void;
}

interface MediaQueryLike {
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isObserver(value: unknown): value is ObserverLike {
  return isObject(value) && typeof Reflect.get(value, 'observe') === 'function'
    && typeof Reflect.get(value, 'disconnect') === 'function';
}

function isMediaQuery(value: unknown): value is MediaQueryLike {
  return isObject(value) && typeof Reflect.get(value, 'addEventListener') === 'function';
}

function numberAt(value: unknown, key: string): number | undefined {
  const field: unknown = isObject(value) ? Reflect.get(value, key) : undefined;
  return typeof field === 'number' ? field : undefined;
}

/** Read one `ResizeObserverEntry`: its device-pixel box when present, and its content rect. */
function boxOf(entry: unknown): BijouCanvasBox | undefined {
  if (!isObject(entry)) return undefined;
  const rect: unknown = Reflect.get(entry, 'contentRect');
  const cssWidth = numberAt(rect, 'width');
  const cssHeight = numberAt(rect, 'height');
  if (cssWidth === undefined || cssHeight === undefined) return undefined;
  const sizes: unknown = Reflect.get(entry, 'devicePixelContentBoxSize');
  const first: unknown = isObject(sizes) ? Reflect.get(sizes, 0) : undefined;
  const width = numberAt(first, 'inlineSize');
  const height = numberAt(first, 'blockSize');
  return width === undefined || height === undefined || width < 1 || height < 1
    ? { cssWidth, cssHeight }
    : { cssWidth, cssHeight, devicePixelContentBox: { width, height } };
}

function construct(name: string, args: readonly unknown[]): unknown {
  const ctor: unknown = Reflect.get(globalThis, name);
  return typeof ctor === 'function' ? Reflect.construct(ctor, args) : undefined;
}

function observeResize(target: BijouCanvasContainer, onBox: (box: BijouCanvasBox) => void): () => void {
  const observer = construct('ResizeObserver', [(entries: readonly unknown[]) => {
    const box = boxOf(entries[entries.length - 1]);
    if (box !== undefined) onBox(box);
  }]);
  if (!isObserver(observer)) {
    throw new BijouCanvasError('BIJOU_WEB_CANVAS_NO_RESIZE_OBSERVER', 'this host has no ResizeObserver; pass options.host');
  }
  try {
    observer.observe(target, { box: 'device-pixel-content-box' });
  } catch {
    observer.observe(target);
  }
  return () => { observer.disconnect(); };
}

function devicePixelRatio(): number {
  const ratio: unknown = Reflect.get(globalThis, 'devicePixelRatio');
  return typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

/** Re-arm a `(resolution: Ndppx)` query on every change, as the ratio moves. */
function watchDevicePixelRatio(onChange: () => void): () => void {
  const matchMedia: unknown = Reflect.get(globalThis, 'matchMedia');
  if (typeof matchMedia !== 'function') return () => undefined;
  let query: MediaQueryLike | undefined;
  const listener = (): void => { arm(); onChange(); };
  function arm(): void {
    query?.removeEventListener('change', listener);
    const next: unknown = Reflect.apply(matchMedia, globalThis, [`(resolution: ${String(devicePixelRatio())}dppx)`]);
    query = isMediaQuery(next) ? next : undefined;
    query?.addEventListener('change', listener);
  }
  arm();
  return () => { query?.removeEventListener('change', listener); query = undefined; };
}

/**
 * The browser host: `ResizeObserver` on the device-pixel content box (the
 * content rect where that box is not supported), `devicePixelRatio`, and a
 * `matchMedia` resolution query for ratio changes.
 */
export const globalCanvasHost: BijouCanvasHost = { observeResize, devicePixelRatio, watchDevicePixelRatio };
