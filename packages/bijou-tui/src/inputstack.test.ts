import { describe, it, expect } from 'vitest';
import { createInputStack, type InputHandler } from './inputstack.js';
import { createKeyMap } from './keybindings.js';
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
// push / pop / size
// ---------------------------------------------------------------------------

describe('push / pop / size', () => {
  it('starts empty', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.size).toBe(0);
    expect(stack.layers()).toEqual([]);
  });

  it('push increases size and returns unique IDs', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const id1 = stack.push(handler({}));
    const id2 = stack.push(handler({}));

    expect(stack.size).toBe(2);
    expect(id1).not.toBe(id2);
  });

  it('pop removes and returns the top layer', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({}), { name: 'base' });
    stack.push(handler({}), { name: 'modal' });

    const popped = stack.pop();
    expect(popped?.name).toBe('modal');
    expect(stack.size).toBe(1);
  });

  it('pop returns undefined when empty', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.pop()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe('remove', () => {
  it('removes a layer by ID', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const id1 = stack.push(handler({}), { name: 'base' });
    stack.push(handler({}), { name: 'top' });

    expect(stack.remove(id1)).toBe(true);
    expect(stack.size).toBe(1);
    expect(stack.layers()[0]?.name).toBe('top');
  });

  it('returns false for unknown ID', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    expect(stack.remove(999)).toBe(false);
  });
});

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

// ---------------------------------------------------------------------------
// integration with KeyMap
// ---------------------------------------------------------------------------

describe('integration with KeyMap', () => {
  it('KeyMap works as an InputHandler in the stack', () => {
    const stack = createInputStack<KeyMsg, Msg>();

    const appKeys = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('?', 'Help', { type: 'help' });

    const modalKeys = createKeyMap<Msg>()
      .bind('enter', 'Confirm', { type: 'confirm' })
      .bind('escape', 'Cancel', { type: 'cancel' });

    stack.push(appKeys, { name: 'app', passthrough: true });
    stack.push(modalKeys, { name: 'modal' });

    // Modal handles its keys
    expect(stack.dispatch(keyMsg('enter'))).toEqual({ type: 'confirm' });
    expect(stack.dispatch(keyMsg('escape'))).toEqual({ type: 'cancel' });

    // Modal blocks app keys
    expect(stack.dispatch(keyMsg('q'))).toBeUndefined();

    // Pop modal — app keys work again
    stack.pop();
    expect(stack.dispatch(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(stack.dispatch(keyMsg('?'))).toEqual({ type: 'help' });
  });

  it('disabled KeyMap bindings pass through', () => {
    const stack = createInputStack<KeyMsg, Msg>();

    const keys = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('?', 'Help', { type: 'help' });

    stack.push(keys, { passthrough: true });

    keys.disable('Quit');
    expect(stack.dispatch(keyMsg('q'))).toBeUndefined();
    expect(stack.dispatch(keyMsg('?'))).toEqual({ type: 'help' });
  });
});

// ---------------------------------------------------------------------------
// layers()
// ---------------------------------------------------------------------------

describe('layers()', () => {
  it('returns layers bottom to top', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    stack.push(handler({}), { name: 'base', passthrough: true });
    stack.push(handler({}), { name: 'modal' });

    const info = stack.layers();
    expect(info).toHaveLength(2);
    expect(info[0]?.name).toBe('base');
    expect(info[0]?.passthrough).toBe(true);
    expect(info[1]?.name).toBe('modal');
    expect(info[1]?.passthrough).toBe(false);
  });
});
