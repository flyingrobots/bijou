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
// dispatch — first match wins
// ---------------------------------------------------------------------------

describe('dispatch — first match wins (top-down)', () => {
  it('top layer takes priority over lower layers', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { passthrough: true });
    stack.push(handler({ q: { type: 'cancel' } }), { passthrough: true });

    // Top layer's 'q' → cancel wins over base's 'q' → quit
    expect(stack.dispatch(keyMsg('q'))).toEqual({ type: 'cancel' });
  });
});
