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
// dispatch — opaque layers (default)
// ---------------------------------------------------------------------------

describe('dispatch — opaque layers', () => {
  it('top layer consumes matching events', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { name: 'base' });
    stack.push(handler({ enter: { type: 'confirm' } }), { name: 'modal' });

    // Modal handles enter
    expect(stack.dispatch(keyMsg('enter'))).toEqual({ type: 'confirm' });
  });

  it('opaque top layer swallows unhandled events', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { name: 'base' });
    stack.push(handler({ enter: { type: 'confirm' } }), { name: 'modal' });

    // 'q' would match base, but modal is opaque — swallowed
    expect(stack.dispatch(keyMsg('q'))).toBeUndefined();
  });
});
