// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoMsg } from '../contract.js';

/** The message the two font demos start with, and the most a person can type. */
export const GREETING = 'Hello World!';
export const MAX_TYPED = 24;

/** What both font demos keep: the message, whether keys are going into it, and whether the HUD card shows. */
export interface Typing {
  readonly text: string;
  readonly typing: boolean;
  readonly hud: boolean;
}

export function startTyping(text: string): Typing {
  return { text, typing: false, hud: true };
}

/** The character a key types, or null: one printable character, `space`, or `shift+<letter>`. */
function characterOf(key: string): string | null {
  if (key === 'space') return ' ';
  const shifted = /^shift\+([a-z])$/u.exec(key)?.[1];
  if (shifted !== undefined) return shifted.toUpperCase();
  return /^[\x21-\x7e]$/u.test(key) ? key : null;
}

function typeInto(state: Typing, key: string): Typing {
  if (key === 'escape') return { ...state, typing: false };
  if (key === 'backspace') return { ...state, text: state.text.slice(0, -1) };
  const char = characterOf(key);
  return char === null || state.text.length >= MAX_TYPED ? state : { ...state, text: state.text + char };
}

/**
 * Message editing, in the demo's own update. In insert mode keys type, backspace deletes and escape finishes; in normal
 * mode `i` or `enter` starts typing, `r` clears the message and `h` hides the HUD.
 */
export function editMessage(msg: DemoMsg, state: Typing): Typing {
  if (msg.type !== 'key') return state;
  if (state.typing) return typeInto(state, msg.key);
  if (msg.key === 'i' || msg.key === 'enter') return { ...state, typing: true };
  if (msg.key === 'r') return { ...state, text: '' };
  return msg.key === 'h' ? { ...state, hud: !state.hud } : state;
}
