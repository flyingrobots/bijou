import { describe, expect, it } from 'vitest';
import { createKeyMap } from './keybindings.js';
import { createFrameKeyMap } from './app-frame-keymap.js';
import {
  describeKeyBindingConflict,
  findKeyBindingConflicts,
} from './keybindings-conflicts.js';

describe('findKeyBindingConflicts', () => {
  it('reports nothing when every combo is claimed once', () => {
    const map = createKeyMap<string>()
      .bind('a', 'Alpha', 'a')
      .bind('b', 'Beta', 'b');
    expect(findKeyBindingConflicts([{ source: 'page', bindings: map.bindings() }])).toEqual([]);
  });

  it('catches a combo bound twice inside one keymap', () => {
    const map = createKeyMap<string>()
      .bind('x', 'First', 'first')
      .bind('x', 'Second', 'second');

    const conflicts = findKeyBindingConflicts([{ source: 'page', bindings: map.bindings() }]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.combo).toBe('x');
    expect(conflicts[0]?.claims.map((claim) => claim.description)).toEqual(['First', 'Second']);
  });

  it('catches a combo claimed by two different layers', () => {
    const frame = createKeyMap<string>().bind(']', 'Next tab', 'tab');
    const page = createKeyMap<string>().bind(']', 'Next color', 'color');

    const conflicts = findKeyBindingConflicts([
      { source: 'frame', bindings: frame.bindings() },
      { source: 'page', bindings: page.bindings() },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.claims.map((claim) => claim.source)).toEqual(['frame', 'page']);
  });

  it('treats modifiers as part of the combo', () => {
    const map = createKeyMap<string>()
      .bind('p', 'Plain', 'plain')
      .bind('ctrl+p', 'With ctrl', 'ctrl');
    expect(findKeyBindingConflicts([{ source: 'page', bindings: map.bindings() }])).toEqual([]);
  });

  it('still reports a collision when one side is disabled', () => {
    // A disabled binding can be re-enabled later; the collision is a property
    // of the registration, not of the current runtime state.
    const map = createKeyMap<string>()
      .bind('x', 'First', 'first')
      .bind('x', 'Second', 'second');
    map.disable('Second');

    const conflicts = findKeyBindingConflicts([{ source: 'page', bindings: map.bindings() }]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.claims.map((claim) => claim.enabled)).toEqual([true, false]);
  });
});

describe('describeKeyBindingConflict', () => {
  it('names which binding is checked first and which never fires', () => {
    const frame = createKeyMap<string>().bind('g', 'Top', 'top');
    const page = createKeyMap<string>().bind('g', 'Green channel', 'green');
    const [conflict] = findKeyBindingConflicts([
      { source: 'frame', bindings: frame.bindings() },
      { source: 'theme-lab', bindings: page.bindings() },
    ]);

    expect(conflict).toBeDefined();
    if (conflict === undefined) return;
    const line = describeKeyBindingConflict(conflict);
    expect(line).toContain('Key g is bound more than once');
    expect(line).toContain('"Top" (frame) is checked first');
    expect(line).toContain('"Green channel" (theme-lab) never fires');
  });
});

describe('the default frame keymap', () => {
  it('does not collide with itself', () => {
    const frame = createFrameKeyMap({ enableSettings: true, enableNotifications: true });
    expect(findKeyBindingConflicts([{ source: 'frame', bindings: frame.bindings() }])).toEqual([]);
  });
});
