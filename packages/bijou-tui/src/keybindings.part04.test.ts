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
// groups
// ---------------------------------------------------------------------------

describe('groups', () => {
  it('assigns group name to bindings', () => {
    const km = createKeyMap<TestAction>()
      .group('Navigation', (g) => g
        .bind('j', 'Down', { type: 'move', dir: 'down' })
        .bind('k', 'Up', { type: 'move', dir: 'up' }),
      );

    const bindings = km.bindings();
    expect(bindings).toHaveLength(2);
    expect(bindings[0].group).toBe('Navigation');
    expect(bindings[1].group).toBe('Navigation');
  });

  it('ungrouped bindings have empty group', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    expect(km.bindings()[0].group).toBe('');
  });

  it('groups do not affect matching', () => {
    const km = createKeyMap<TestAction>()
      .group('Nav', (g) => g
        .bind('j', 'Down', { type: 'move', dir: 'down' }),
      );

    expect(km.handle(keyMsg('j'))).toEqual({ type: 'move', dir: 'down' });
  });

  it('restores previous group scope after group block', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' })
      .group('Nav', (g) => g.bind('j', 'Down', { type: 'move', dir: 'down' }))
      .bind('?', 'Help', { type: 'help' });

    const bindings = km.bindings();
    expect(bindings[0].group).toBe('');
    expect(bindings[1].group).toBe('Nav');
    expect(bindings[2].group).toBe('');
  });
});
