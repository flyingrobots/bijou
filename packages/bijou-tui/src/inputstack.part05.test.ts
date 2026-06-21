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
// dispatch — passthrough layers
// ---------------------------------------------------------------------------

describe('dispatch — passthrough layers', () => {
  it('passthrough layer lets unhandled events fall through', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { name: 'base' });
    stack.push(handler({ '?': { type: 'help' } }), { name: 'overlay', passthrough: true });

    // '?' handled by overlay
    expect(stack.dispatch(keyMsg('?'))).toEqual({ type: 'help' });
    // 'q' falls through overlay to base
    expect(stack.dispatch(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('multiple passthrough layers cascade', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { passthrough: true });
    stack.push(handler({ '?': { type: 'help' } }), { passthrough: true });
    stack.push(handler({ j: { type: 'move', dir: 'down' } }), { passthrough: true });

    expect(stack.dispatch(keyMsg('j'))).toEqual({ type: 'move', dir: 'down' });
    expect(stack.dispatch(keyMsg('?'))).toEqual({ type: 'help' });
    expect(stack.dispatch(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('opaque layer in the middle blocks further fallthrough', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({ q: { type: 'quit' } }), { name: 'base', passthrough: true });
    stack.push(handler({ enter: { type: 'confirm' } }), { name: 'modal' }); // opaque
    stack.push(handler({ '?': { type: 'help' } }), { name: 'tooltip', passthrough: true });

    // '?' handled by tooltip
    expect(stack.dispatch(keyMsg('?'))).toEqual({ type: 'help' });
    // 'enter' falls through tooltip, handled by modal
    expect(stack.dispatch(keyMsg('enter'))).toEqual({ type: 'confirm' });
    // 'q' falls through tooltip, hits opaque modal, swallowed — never reaches base
    expect(stack.dispatch(keyMsg('q'))).toBeUndefined();
  });
});
