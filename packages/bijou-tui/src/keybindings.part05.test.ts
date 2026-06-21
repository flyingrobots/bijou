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
// enable / disable
// ---------------------------------------------------------------------------

describe('enable / disable', () => {
  it('disabled bindings are skipped during handle', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    km.disable('Quit');
    expect(km.handle(keyMsg('q'))).toBeUndefined();
  });

  it('re-enabling restores matching', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    km.disable('Quit');
    km.enable('Quit');
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('disable with predicate function', () => {
    const km = createKeyMap<TestAction>()
      .group('Nav', (g) => g
        .bind('j', 'Down', { type: 'move', dir: 'down' })
        .bind('k', 'Up', { type: 'move', dir: 'up' }),
      )
      .bind('q', 'Quit', { type: 'quit' });

    km.disable((b) => b.group === 'Nav');
    expect(km.handle(keyMsg('j'))).toBeUndefined();
    expect(km.handle(keyMsg('k'))).toBeUndefined();
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
  });

  it('enableGroup / disableGroup', () => {
    const km = createKeyMap<TestAction>()
      .group('Nav', (g) => g
        .bind('j', 'Down', { type: 'move', dir: 'down' }),
      )
      .bind('q', 'Quit', { type: 'quit' });

    km.disableGroup('Nav');
    expect(km.handle(keyMsg('j'))).toBeUndefined();
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });

    km.enableGroup('Nav');
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'move', dir: 'down' });
  });

  it('bindings() reflects enabled state', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    expect(km.bindings()[0].enabled).toBe(true);
    km.disable('Quit');
    expect(km.bindings()[0].enabled).toBe(false);
  });
});
