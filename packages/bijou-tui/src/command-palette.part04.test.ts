import { describe, it, expect } from 'vitest';
import { createCommandPaletteState, cpFilter, cpFocusNext, cpPageDown, cpPageUp } from './command-palette.js';
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
// Page navigation
// ---------------------------------------------------------------------------

describe('page navigation (half-page)', () => {
  it('pageDown moves by half height', () => {
    const state = createCommandPaletteState(items, 4);
    const paged = cpPageDown(state);
    // half = floor(4 / 2) = 2
    expect(paged.focusIndex).toBe(2);
  });

  it('pageDown with odd height uses floor(height/2)', () => {
    // 5 items, height 5 → half = floor(5/2) = 2
    const state = createCommandPaletteState(items, 5);
    const paged = cpPageDown(state);
    expect(paged.focusIndex).toBe(2);
  });

  it('pageDown with height 1 moves by 1', () => {
    const state = createCommandPaletteState(items, 1);
    const paged = cpPageDown(state);
    // half = max(1, floor(1/2)) = max(1, 0) = 1
    expect(paged.focusIndex).toBe(1);
  });

  it('pageDown clamps to last item', () => {
    const state = createCommandPaletteState(items, 10);
    const paged = cpPageDown(state);
    expect(paged.focusIndex).toBe(items.length - 1);
  });

  it('pageUp moves by half height', () => {
    let state = createCommandPaletteState(items, 4);
    // Move to index 4 first
    for (let i = 0; i < 4; i++) state = cpFocusNext(state);
    const paged = cpPageUp(state);
    // half = floor(4 / 2) = 2, so 4 - 2 = 2
    expect(paged.focusIndex).toBe(2);
  });

  it('pageUp clamps to first item', () => {
    const state = createCommandPaletteState(items, 10);
    const paged = cpPageUp(state);
    expect(paged.focusIndex).toBe(0);
  });

  it('empty list is a no-op', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'zzzzz');
    expect(cpPageDown(state)).toBe(state);
    expect(cpPageUp(state)).toBe(state);
  });
});
