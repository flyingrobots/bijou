import { describe, it, expect } from 'vitest';
import { createCommandPaletteState } from './command-palette.js';
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
// createCommandPaletteState
// ---------------------------------------------------------------------------

describe('createCommandPaletteState', () => {
  it('creates state with defaults', () => {
    const state = createCommandPaletteState(items);
    expect(state.focusIndex).toBe(0);
    expect(state.scrollY).toBe(0);
    expect(state.height).toBe(10);
    expect(state.query).toBe('');
    expect(state.items).toHaveLength(items.length);
    expect(state.filteredItems).toHaveLength(items.length);
  });

  it('accepts custom height', () => {
    const state = createCommandPaletteState(items, 3);
    expect(state.height).toBe(3);
  });

  it('clamps height to 1', () => {
    expect(createCommandPaletteState(items, 0).height).toBe(1);
    expect(createCommandPaletteState(items, -5).height).toBe(1);
  });

  it('makes a defensive copy of items', () => {
    const mutable = [...items];
    const state = createCommandPaletteState(mutable);
    mutable.push({ id: 'new', label: 'New' });
    expect(state.items).toHaveLength(items.length);
  });
});
