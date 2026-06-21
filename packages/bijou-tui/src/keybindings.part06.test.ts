import { describe, it, expect } from 'vitest';
import { createKeyMap } from './keybindings.js';

type TestAction =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string };

// ---------------------------------------------------------------------------
// bindings() snapshot isolation
// ---------------------------------------------------------------------------

describe('bindings()', () => {
  it('returns all registered bindings', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' })
      .group('Nav', (g) => g
        .bind('j', 'Down', { type: 'move', dir: 'down' })
        .bind('k', 'Up', { type: 'move', dir: 'up' }),
      );

    expect(km.bindings()).toHaveLength(3);
  });

  it('does not expose action (info only)', () => {
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', { type: 'quit' });

    const info = km.bindings()[0];
    expect(info).toEqual({
      combo: { key: 'q', ctrl: false, alt: false, shift: false },
      description: 'Quit',
      group: '',
      enabled: true,
    });
    expect('action' in info).toBe(false);
  });
});
