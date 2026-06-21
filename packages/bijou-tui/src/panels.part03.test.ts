import { describe, it, expect } from 'vitest';
import { createPanelGroup } from './panels.js';
import type { PanelDef } from './panels.js';
import type { KeyMsg } from './types.js';
import { createKeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Msg { type: string }

function key(k: string): KeyMsg {
  return { type: 'key', key: k, ctrl: false, alt: false, shift: false };
}

function makePanels(): readonly PanelDef<Msg>[] {
  const navMap = createKeyMap<Msg>()
    .bind('j', 'Down', { type: 'nav-down' })
    .bind('k', 'Up', { type: 'nav-up' });

  const detailMap = createKeyMap<Msg>()
    .bind('j', 'Scroll down', { type: 'detail-down' })
    .bind('enter', 'Select', { type: 'detail-select' });

  return [
    { id: 'nav', hotkey: '1', label: 'Navigation', keyMap: navMap },
    { id: 'detail', hotkey: '2', label: 'Details', keyMap: detailMap },
  ];
}

// ---------------------------------------------------------------------------
// Delegation
// ---------------------------------------------------------------------------

describe('PanelGroup delegation', () => {
  it('delegates to focused panel keyMap', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    const result = group.handle(key('j'));
    expect(result).toEqual({ type: 'nav-down' });
  });

  it('delegates after switch', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    group.handle(key('2')); // switch to detail
    const result = group.handle(key('j'));
    expect(result).toEqual({ type: 'detail-down' });
  });

  it('unfocused panel does not fire', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    // 'enter' is only bound in detail panel
    const result = group.handle(key('enter'));
    expect(result).toBeUndefined();
  });

  it('unbound keys return undefined', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    const result = group.handle(key('x'));
    expect(result).toBeUndefined();
  });

  it('hotkey returns undefined (side effect only)', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    const result = group.handle(key('2'));
    expect(result).toBeUndefined();
  });
});
