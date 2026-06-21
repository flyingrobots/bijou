import { describe, it, expect } from 'vitest';
import { createCommandPaletteState, cpFilter, cpFocusNext } from './command-palette.js';
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
// cpFilter
// ---------------------------------------------------------------------------

describe('cpFilter', () => {
  it('matches by label', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'save');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]?.id).toBe('save');
  });

  it('matches by description', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'disk');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]?.id).toBe('open');
  });

  it('matches by category', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'file');
    expect(filtered.filteredItems).toHaveLength(2);
  });

  it('matches by id', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'split');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]?.id).toBe('split');
  });

  it('matches by shortcut', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'ctrl+o');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]?.id).toBe('open');
  });

  it('matches hidden search text', () => {
    const state = createCommandPaletteState([
      ...items,
      { id: 'release', label: 'Release Notes', searchText: 'migration guide upgrade table' },
    ]);
    const filtered = cpFilter(state, 'migration');

    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]?.id).toBe('release');
  });

  it('ranks label matches before incidental description matches', () => {
    const state = createCommandPaletteState([
      { id: 'reference', label: 'Reference', description: 'Mentions table in body text' },
      { id: 'table', label: 'table() / navigableTableSurface()', description: 'Dense comparison docs' },
    ]);
    const filtered = cpFilter(state, 'table');

    expect(filtered.filteredItems.map((item) => item.id)).toEqual(['table', 'reference']);
  });

  it('is case-insensitive', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'SAVE');
    expect(filtered.filteredItems).toHaveLength(1);
  });

  it('resets focus to 0', () => {
    let state = createCommandPaletteState(items);
    state = cpFocusNext(cpFocusNext(state)); // focus at 2
    const filtered = cpFilter(state, 'file');
    expect(filtered.focusIndex).toBe(0);
    expect(filtered.scrollY).toBe(0);
  });

  it('empty query shows all items', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'save');
    expect(state.filteredItems).toHaveLength(1);
    state = cpFilter(state, '');
    expect(state.filteredItems).toHaveLength(items.length);
  });

  it('no matches returns empty filteredItems', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'zzzzz');
    expect(filtered.filteredItems).toHaveLength(0);
  });
});
