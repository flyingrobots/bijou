import type { KeyInputMsg, RawInputHandle, RuntimePort } from '@flyingrobots/bijou';
import { encodeKey } from './key-encode.js';
import { createWebOutputIO, type WebOutputIO, type WebOutputIOOptions } from './output-io.js';
import { bindPointer, cellAt, sgrPacket, type WebCell, type WebGridSize, type WebMouseMsg } from './pointer.js';
import { createPassThrough, type WebPassThrough, type WebPlatform } from './shortcuts.js';
import { bindTextarea } from './text-bridge.js';
import type { WebPointerSurface, WebTextareaLike } from './web-dom.js';

/** Options for {@link createWebInteractiveIO}. */
export interface WebInteractiveIOOptions extends WebOutputIOOptions {
  /** Hidden `<textarea>` that receives keys, IME composition, and paste. */
  readonly textarea?: WebTextareaLike;
  /** Element that pointer and wheel events address. */
  readonly surface?: WebPointerSurface;
  /** Source of the grid size for pointer hit-testing. Defaults to 80 by 24. */
  readonly runtime?: Pick<RuntimePort, 'columns' | 'rows'>;
  /** Selects the default pass-through policy. Defaults to `'other'`. */
  readonly platform?: WebPlatform;
  /** Replaces the default pass-through policy. */
  readonly passThrough?: WebPassThrough;
  /** Called with the original text of a rejected multi-line paste. */
  readonly onPasteRejected?: (text: string) => void;
}

/** An {@link WebOutputIO} that also reads keyboard, IME, paste, pointer, and wheel input. */
export interface WebInteractiveIO extends WebOutputIO {
  /** Structured keys. Committed IME and paste text arrive as `text`. */
  keyInput(onKey: (key: KeyInputMsg) => void): RawInputHandle;
  /** Mouse messages with 0-based cells. */
  mouseInput(onMouse: (msg: WebMouseMsg) => void): RawInputHandle;
  /** The 0-based cell under a client point, clamped to the grid. */
  cellFromPoint(clientX: number, clientY: number): WebCell;
  /** Remove every listener and end every stream. Safe to call again. */
  dispose(): void;
}

interface Subscription<T> { readonly callback: (value: T) => void }

const DEFAULT_SIZE: WebGridSize = { columns: 80, rows: 24 };
const INERT: RawInputHandle = { dispose: () => undefined };

/**
 * Create an {@link IOPort} that reads browser input.
 *
 * Listeners attach when the first stream is subscribed and detach when the
 * last one is disposed, or on `dispose()`. `rawInput()` carries the terminal
 * byte encoding of keys, text, and SGR mouse packets; `keyInput()` and
 * `mouseInput()` carry structured messages.
 *
 * @param options - Input elements, grid size, shortcut policy, and the output options.
 * @returns The I/O port.
 */
export function createWebInteractiveIO(options: WebInteractiveIOOptions = {}): WebInteractiveIO {
  const base = createWebOutputIO(options);
  const passThrough = options.passThrough ?? createPassThrough(options.platform ?? 'other');
  const keys = new Set<Subscription<KeyInputMsg>>();
  const raws = new Set<Subscription<string>>();
  const mice = new Set<Subscription<WebMouseMsg>>();
  const resizes = new Set<RawInputHandle>();
  let detach: (() => void) | undefined;
  let disposed = false;

  const size = (): WebGridSize => options.runtime ?? DEFAULT_SIZE;
  const publish = <T>(set: ReadonlySet<Subscription<T>>, value: T): void => {
    for (const sub of [...set]) if (set.has(sub)) sub.callback(value);
  };
  const onKey = (msg: KeyInputMsg): void => {
    publish(keys, msg);
    publish(raws, encodeKey(msg));
  };
  const onMouse = (msg: WebMouseMsg): void => {
    publish(mice, msg);
    publish(raws, sgrPacket(msg));
  };
  const attach = (): (() => void) => {
    const detachers = [
      ...(options.textarea === undefined ? [] : [bindTextarea(options.textarea, onKey, {
        passThrough, ...(options.onPasteRejected === undefined ? {} : { onPasteRejected: options.onPasteRejected }),
      })]),
      ...(options.surface === undefined ? [] : [bindPointer(options.surface, size, onMouse)]),
    ];
    return () => { for (const remove of detachers) remove(); };
  };
  const sync = (): void => {
    const wanted = keys.size + raws.size + mice.size > 0;
    if (wanted && detach === undefined) detach = attach();
    else if (!wanted && detach !== undefined) {
      detach();
      detach = undefined;
    }
  };
  const subscribe = <T>(set: Set<Subscription<T>>, callback: (value: T) => void): RawInputHandle => {
    if (disposed) return INERT;
    const sub = { callback };
    set.add(sub);
    sync();
    return { dispose() { if (set.delete(sub)) sync(); } };
  };

  return {
    ...base,
    keyInput: (callback) => subscribe(keys, callback),
    rawInput: (callback) => subscribe(raws, callback),
    mouseInput: (callback) => subscribe(mice, callback),
    cellFromPoint: (x, y) => options.surface === undefined
      ? { col: 0, row: 0 }
      : cellAt(options.surface.getBoundingClientRect(), size(), x, y),
    onResize(callback) {
      if (disposed) return INERT;
      const inner = base.onResize(callback);
      const handle: RawInputHandle = {
        dispose() { if (resizes.delete(handle)) inner.dispose(); },
      };
      resizes.add(handle);
      return handle;
    },
    dispose() {
      disposed = true;
      keys.clear();
      raws.clear();
      mice.clear();
      sync();
      for (const handle of [...resizes]) handle.dispose();
    },
  };
}
