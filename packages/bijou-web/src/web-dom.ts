/** Options a listener can be registered with. */
export interface WebListenerOptions {
  /** `false` lets the listener call `preventDefault()` on a wheel event. */
  readonly passive?: boolean;
}

/** The part of `EventTarget` the adapters use. */
export interface WebEventTarget<E> {
  addEventListener(type: string, listener: (event: E) => void, options?: WebListenerOptions): void;
  removeEventListener(type: string, listener: (event: E) => void): void;
}

/** Clipboard payload of a paste event. */
export interface WebClipboardData {
  getData(format: string): string;
}

/** Keyboard, input, composition, and paste fields the text bridge reads. */
export interface WebTextEvent {
  readonly key?: string;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly shiftKey?: boolean;
  readonly metaKey?: boolean;
  readonly isComposing?: boolean;
  readonly data?: string | null;
  readonly inputType?: string;
  readonly clipboardData?: WebClipboardData | null;
  preventDefault(): void;
}

/** The hidden `<textarea>` that receives keyboard, IME, and paste input. */
export interface WebTextareaLike extends WebEventTarget<WebTextEvent> {
  value: string;
}

/** Client-space rectangle of the surface that pointer events hit. */
export interface WebRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Pointer and wheel fields the pointer bridge reads. */
export interface WebPointerEvent {
  readonly clientX: number;
  readonly clientY: number;
  readonly button?: number;
  readonly buttons?: number;
  readonly deltaY?: number;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  preventDefault?(): void;
}

/** The element whose cells pointer and wheel events address. */
export interface WebPointerSurface extends WebEventTarget<WebPointerEvent> {
  getBoundingClientRect(): WebRect;
}
