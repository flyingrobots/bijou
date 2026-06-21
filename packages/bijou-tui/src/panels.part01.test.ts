import { describe, it, expect } from 'vitest';
import { createPanelGroup } from './panels.js';
import type { PanelDef } from './panels.js';
import { createKeyMap } from './keybindings.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Msg { type: string }

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

describe('PanelGroup validation', () => {
  it('throws when defaultFocus refers to non-existent panel', () => {
    expect(() =>
      createPanelGroup({ panels: makePanels(), defaultFocus: 'nonexistent' }),
    ).toThrow('defaultFocus "nonexistent"');
  });
});
