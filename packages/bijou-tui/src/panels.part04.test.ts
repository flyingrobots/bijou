import { describe, it, expect } from 'vitest';
import { createPanelGroup } from './panels.js';
import type { PanelDef } from './panels.js';
import { createKeyMap } from './keybindings.js';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

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
