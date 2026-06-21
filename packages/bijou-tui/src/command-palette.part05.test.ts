import { describe, it, expect } from 'vitest';
import { createCommandPaletteState, cpFilter, cpFocusNext, cpSelectedItem } from './command-palette.js';
import type { CommandPaletteItem } from './command-palette.js';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const items: CommandPaletteItem[] = [
  { id: 'open', label: 'Open File', description: 'Open a file from disk', category: 'File', shortcut: 'Ctrl+O' },
  { id: 'save', label: 'Save', description: 'Save current file', category: 'File', shortcut: 'Ctrl+S' },
  { id: 'close', label: 'Close Tab', description: 'Close the active tab', category: 'Tab' },
  { id: 'split', label: 'Split Editor', category: 'View' },
  { id: 'theme', label: 'Change Theme', description: 'Switch color theme', category: 'Preferences' },
];

// ---------------------------------------------------------------------------
// cpSelectedItem
// ---------------------------------------------------------------------------

describe('cpSelectedItem', () => {
  it('returns focused item', () => {
    const state = createCommandPaletteState(items);
    expect(cpSelectedItem(state)?.id).toBe('open');
  });

  it('returns undefined when no matches', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'zzzzz');
    expect(cpSelectedItem(state)).toBeUndefined();
  });

  it('returns correct item after navigation', () => {
    let state = createCommandPaletteState(items);
    state = cpFocusNext(state);
    state = cpFocusNext(state);
    expect(cpSelectedItem(state)?.id).toBe('close');
  });
});
