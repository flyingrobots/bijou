import { describe, it, expect } from 'vitest';
import { createPanelGroup } from './panels.js';
import type { PanelDef } from './panels.js';
import type { KeyMsg } from './types.js';
import { createKeyMap } from './keybindings.js';
import { createInputStack } from './inputstack.js';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Msg = { type: string };

function key(k: string): KeyMsg {
  return { type: 'key', key: k, ctrl: false, alt: false, shift: false };
}

function ctrlKey(k: string): KeyMsg {
  return { type: 'key', key: k, ctrl: true, alt: false, shift: false };
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
// Focus
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// formatLabel
// ---------------------------------------------------------------------------

describe('PanelGroup formatLabel', () => {
  it('contains hotkey prefix without ctx', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    const label = group.formatLabel('nav');
    expect(label).toContain('[1]');
    expect(label).toContain('Navigation');
  });

  it('returns empty for unknown panel', () => {
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    expect(group.formatLabel('unknown')).toBe('');
  });

  it('runs with ctx without error', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav' });
    const focused = group.formatLabel('nav', ctx);
    const unfocused = group.formatLabel('detail', ctx);
    expect(focused).toContain('Navigation');
    expect(unfocused).toContain('Details');
  });
});

// ---------------------------------------------------------------------------
// InputStack integration
// ---------------------------------------------------------------------------

describe('PanelGroup with InputStack', () => {
  it('pushes 2 layers on creation', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    createPanelGroup({ panels: makePanels(), defaultFocus: 'nav', inputStack: stack });
    expect(stack.size).toBe(2);
  });

  it('swaps panel layer on focus change', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav', inputStack: stack });
    const layersBefore = stack.layers().map(l => l.name);
    expect(layersBefore).toContain('panel:nav');

    group.focus('detail');
    const layersAfter = stack.layers().map(l => l.name);
    expect(layersAfter).not.toContain('panel:nav');
    expect(layersAfter).toContain('panel:detail');
    // Still 2 layers total
    expect(stack.size).toBe(2);
  });

  it('dispose removes all layers', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav', inputStack: stack });
    expect(stack.size).toBe(2);
    group.dispose();
    expect(stack.size).toBe(0);
  });

  it('dispatch through stack reaches focused panel', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    createPanelGroup({ panels: makePanels(), defaultFocus: 'nav', inputStack: stack });
    // Dispatch j → should reach nav panel's keymap via stack
    const result = stack.dispatch(key('j'));
    expect(result).toEqual({ type: 'nav-down' });
  });

  it('dispatch routes to new panel after hotkey-triggered switch', () => {
    const stack = createInputStack<KeyMsg, Msg>();
    const group = createPanelGroup({ panels: makePanels(), defaultFocus: 'nav', inputStack: stack });
    // Hotkey '2' triggers focus switch via the hotkey layer in the stack
    stack.dispatch(key('2'));
    // Now focused should be detail
    expect(group.focused).toBe('detail');
    // j should now dispatch to detail panel
    const result = stack.dispatch(key('j'));
    expect(result).toEqual({ type: 'detail-down' });
  });
});
