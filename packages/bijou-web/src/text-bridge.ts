import type { KeyInputMsg } from '@flyingrobots/bijou';
import { keyFromEvent } from './key-map.js';
import { createListenerSet } from './listeners.js';
import type { WebPassThrough } from './shortcuts.js';
import type { WebTextareaLike } from './web-dom.js';

/** Options for {@link bindTextarea}. */
export interface TextBridgeOptions {
  readonly passThrough: WebPassThrough;
  readonly onPasteRejected?: (text: string) => void;
}

const LINE_BREAK_AT_END = /(?:\r\n|\r|\n)$/u;
const LINE_BREAK = /[\r\n]/u;

/** Drop C0, DEL, and C1 controls, so typed or pasted text cannot forge escape sequences. */
function stripControls(text: string): string {
  return Array.from(text).filter((char) => {
    const code = char.codePointAt(0) ?? 0;
    return code >= 0x20 && (code < 0x7f || code > 0x9f);
  }).join('');
}

/**
 * Bridge a hidden `<textarea>` into structured keys.
 *
 * Composition is tracked explicitly: `keydown` is ignored while composing, the
 * text arrives once on `compositionend`, and the `input` event that follows
 * (or precedes) it is dropped. Text from `input` is delivered only when no
 * composition is open. Single-line paste is delivered whole; multi-line paste
 * is rejected, never turned into Enter keys.
 *
 * @returns A function that removes every listener.
 */
export function bindTextarea(
  textarea: WebTextareaLike,
  emit: (msg: KeyInputMsg) => void,
  options: TextBridgeOptions,
): () => void {
  const listeners = createListenerSet();
  let composing = false;
  let settled: string | undefined;

  const send = (value: string): void => {
    const text = stripControls(value);
    if (text !== '') emit({ key: text, ctrl: false, alt: false, shift: false, text });
  };

  listeners.add(textarea, 'keydown', (event) => {
    settled = undefined;
    if (composing || event.isComposing === true) return;
    const msg = keyFromEvent(event);
    if (msg === undefined) return;
    const chord = { key: event.key ?? '', ctrl: msg.ctrl, alt: event.altKey === true, shift: msg.shift, meta: event.metaKey === true };
    if (options.passThrough(chord)) return;
    event.preventDefault();
    emit(msg);
  });
  listeners.add(textarea, 'compositionstart', () => {
    composing = true;
    settled = undefined;
  });
  listeners.add(textarea, 'compositionend', (event) => {
    composing = false;
    const data = event.data ?? '';
    settled = data === '' ? undefined : data;
    textarea.value = '';
    send(data);
  });
  listeners.add(textarea, 'input', (event) => {
    if (composing || event.isComposing === true) return;
    const data = event.data ?? '';
    const duplicate = settled !== undefined && settled === data;
    settled = undefined;
    textarea.value = '';
    if (event.inputType === 'deleteContentBackward') {
      emit({ key: 'backspace', ctrl: false, alt: false, shift: false });
    } else if (!duplicate && event.inputType?.startsWith('insertFrom') !== true) {
      send(data);
    }
  });
  listeners.add(textarea, 'paste', (event) => {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text/plain') ?? '';
    const text = pasted.replace(LINE_BREAK_AT_END, '');
    if (LINE_BREAK.test(text)) options.onPasteRejected?.(pasted);
    else send(text);
  });
  return () => { listeners.removeAll(); };
}
