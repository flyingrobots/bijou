import { describe, it, expect } from 'vitest';
import { createKeyMap } from './keybindings.js';
import type { KeyMsg } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

type TestAction =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string };

// ---------------------------------------------------------------------------
// createKeyMap — bind & handle
// ---------------------------------------------------------------------------

describe('createKeyMap', () => {
  it('matches a simple key binding', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    const result = km.handle(keyMsg('q'));
    expect(result).toEqual({ type: 'quit' });
  });

  it('returns undefined for unbound keys', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });

  it('matches modifier combos', () => {
    const km = createKeyMap<TestAction>()
      .bind('ctrl+c', 'Force quit', { type: 'quit' });

    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c'))).toBeUndefined();
  });

  it('returns the same action reference each time', () => {
    const action: TestAction = { type: 'quit' };
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', action);

    expect(km.handle(keyMsg('q'))).toBe(action);
    expect(km.handle(keyMsg('q'))).toBe(action);
  });

  it('first matching binding wins', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('q', 'Help', { type: 'help' });

    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('is chainable', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('?', 'Help', { type: 'help' });

    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('?'))).toEqual({ type: 'help' });
  });
});
