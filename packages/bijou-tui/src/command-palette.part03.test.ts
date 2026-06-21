import { describe, it, expect } from 'vitest';
import { createCommandPaletteState, cpFilter, cpFocusNext, cpFocusPrev } from './command-palette.js';
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
// Focus navigation
// ---------------------------------------------------------------------------

describe('focus navigation', () => {
  it('focusNext moves forward', () => {
    const state = createCommandPaletteState(items);
    const next = cpFocusNext(state);
    expect(next.focusIndex).toBe(1);
  });

  it('focusNext wraps around', () => {
    let state = createCommandPaletteState(items);
    for (const item of items) {
      void item;
      state = cpFocusNext(state);
    }
    expect(state.focusIndex).toBe(0);
  });

  it('focusPrev moves backward', () => {
    let state = createCommandPaletteState(items);
    state = cpFocusNext(state);
    state = cpFocusPrev(state);
    expect(state.focusIndex).toBe(0);
  });

  it('focusPrev wraps around', () => {
    const state = createCommandPaletteState(items);
    const prev = cpFocusPrev(state);
    expect(prev.focusIndex).toBe(items.length - 1);
  });

  it('empty list is a no-op', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'zzzzz');
    expect(cpFocusNext(state)).toBe(state);
    expect(cpFocusPrev(state)).toBe(state);
  });
});
