import { describe, it, expect } from 'vitest';
import {
  createKeyMap,
  parseKeyCombo,
  formatKeyCombo,
} from './keybindings.js';
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
  | { type: 'move'; dir: string }
  | { type: 'select' }
  | { type: 'delete' };

// ---------------------------------------------------------------------------
// parseKeyCombo
// ---------------------------------------------------------------------------

describe('parseKeyCombo', () => {
  it('parses a plain key', () => {
    expect(parseKeyCombo('q')).toEqual({
      key: 'q', ctrl: false, alt: false, shift: false,
    });
  });

  it('parses ctrl modifier', () => {
    expect(parseKeyCombo('ctrl+c')).toEqual({
      key: 'c', ctrl: true, alt: false, shift: false,
    });
  });

  it('parses alt modifier', () => {
    expect(parseKeyCombo('alt+x')).toEqual({
      key: 'x', ctrl: false, alt: true, shift: false,
    });
  });

  it('parses shift modifier', () => {
    expect(parseKeyCombo('shift+tab')).toEqual({
      key: 'tab', ctrl: false, alt: false, shift: true,
    });
  });

  it('parses multiple modifiers', () => {
    expect(parseKeyCombo('ctrl+alt+delete')).toEqual({
      key: 'delete', ctrl: true, alt: true, shift: false,
    });
  });

  it('is case-insensitive', () => {
    expect(parseKeyCombo('Ctrl+C')).toEqual({
      key: 'c', ctrl: true, alt: false, shift: false,
    });
  });

  it('parses named keys', () => {
    expect(parseKeyCombo('enter')).toEqual({
      key: 'enter', ctrl: false, alt: false, shift: false,
    });
    expect(parseKeyCombo('space')).toEqual({
      key: 'space', ctrl: false, alt: false, shift: false,
    });
    expect(parseKeyCombo('escape')).toEqual({
      key: 'escape', ctrl: false, alt: false, shift: false,
    });
  });
});

// ---------------------------------------------------------------------------
// formatKeyCombo
// ---------------------------------------------------------------------------

describe('formatKeyCombo', () => {
  it('formats a plain key', () => {
    expect(formatKeyCombo({ key: 'q', ctrl: false, alt: false, shift: false }))
      .toBe('q');
  });

  it('formats ctrl modifier', () => {
    expect(formatKeyCombo({ key: 'c', ctrl: true, alt: false, shift: false }))
      .toBe('Ctrl+c');
  });

  it('capitalizes named keys', () => {
    expect(formatKeyCombo({ key: 'tab', ctrl: false, alt: false, shift: true }))
      .toBe('Shift+Tab');
  });

  it('formats all modifiers', () => {
    expect(formatKeyCombo({ key: 'delete', ctrl: true, alt: true, shift: false }))
      .toBe('Ctrl+Alt+Delete');
  });
});

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

  it('supports function actions', () => {
    let callCount = 0;
    const km = createKeyMap<TestAction>()
      .bind('q', 'Quit', () => { callCount++; return { type: 'quit' }; });

    km.handle(keyMsg('q'));
    km.handle(keyMsg('q'));
    expect(callCount).toBe(2);
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
    expect((info as any).action).toBeUndefined();
  });
});
