import { describe, it, expect } from 'vitest';
import { createInputStack, type InputHandler } from './inputstack.js';
import type { KeyMsg } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

type Msg =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string }
  | { type: 'confirm' }
  | { type: 'cancel' };

/** Simple inline handler for tests. */
function handler(map: Record<string, Msg>): InputHandler<KeyMsg, Msg> {
  return {
    handle(msg) {
      return map[msg.key];
    },
  };
}

// ---------------------------------------------------------------------------
// dispatch — single layer
// ---------------------------------------------------------------------------

describe('dispatch — single layer', () => {
  it('returns action when handler matches', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }));

    expect(stack.dispatch(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('returns undefined when handler does not match', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }));

    expect(stack.dispatch(keyMsg('x'))).toBeUndefined();
  });

  it('returns undefined when stack is empty', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.dispatch(keyMsg('q'))).toBeUndefined();
  });
});
