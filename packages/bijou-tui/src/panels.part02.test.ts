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

describe('PanelGroup focus', () => {
  it('starts with defaultFocus', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    expect(group.focused).toBe('nav');
  });

  it('switches via hotkey', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    group.handle(key('2'));
    expect(group.focused).toBe('detail');
  });

  it('switches back', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    group.handle(key('2'));
    group.handle(key('1'));
    expect(group.focused).toBe('nav');
  });

  it('ignores unknown hotkey', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    group.handle(key('9'));
    expect(group.focused).toBe('nav');
  });

  it('no-ops on same panel hotkey', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    group.handle(key('1'));
    expect(group.focused).toBe('nav');
  });
});
