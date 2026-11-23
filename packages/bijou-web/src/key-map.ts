import type { KeyInputMsg } from '@flyingrobots/bijou';
import type { WebTextEvent } from './web-dom.js';

const NAMED: Readonly<Record<string, string>> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'enter', Escape: 'escape', Tab: 'tab', Backspace: 'backspace',
  Delete: 'delete', Insert: 'insert', Home: 'home', End: 'end',
  PageUp: 'pageup', PageDown: 'pagedown', ' ': 'space',
};

const FUNCTION_KEY = /^F(?:[1-9]|1[0-2])$/u;
const UPPERCASE_ASCII = /^[A-Z]$/u;

function nameOf(key: string): string | undefined {
  const named = NAMED[key];
  if (named !== undefined) return named;
  return FUNCTION_KEY.test(key) ? key.toLowerCase() : undefined;
}

/**
 * Map a `keydown` event to a Bijou {@link KeyInputMsg}, with the key names
 * the terminal host produces: `up`, `enter`, `f2`, `space`, and lowercase
 * letters (an uppercase ASCII letter is `shift` plus the lowercase name).
 * `alt` is set for Alt or Meta. Modifier-only, dead, and unidentified keys
 * map to `undefined`.
 */
export function keyFromEvent(event: WebTextEvent): KeyInputMsg | undefined {
  const key = event.key;
  if (key === undefined) return undefined;
  const ctrl = event.ctrlKey === true;
  const alt = event.altKey === true || event.metaKey === true;
  const shift = event.shiftKey === true;
  const name = nameOf(key);
  if (name !== undefined) {
    const msg: KeyInputMsg = { key: name, ctrl, alt, shift };
    return key === ' ' && !ctrl && !alt ? { ...msg, text: ' ' } : msg;
  }
  if (Array.from(key).length !== 1) return undefined;
  const lower = UPPERCASE_ASCII.test(key) ? key.toLowerCase() : key;
  if (ctrl || alt) return { key: lower, ctrl, alt, shift };
  return { key: lower, ctrl: false, alt: false, shift: lower !== key, text: key };
}
