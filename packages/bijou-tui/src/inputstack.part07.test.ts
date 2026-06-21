import { describe, it, expect } from 'vitest';
import { createInputStack } from './inputstack.js';
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
