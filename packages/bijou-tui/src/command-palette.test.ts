import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { visibleLength, stripAnsi } from './viewport.js';
import {
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
  commandPalette,
  commandPaletteKeyMap,
} from './command-palette.js';
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

// ---------------------------------------------------------------------------
// cpFilter
// ---------------------------------------------------------------------------

describe('cpFilter', () => {
  it('matches by label', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'save');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]!.id).toBe('save');
  });

  it('matches by description', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'disk');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]!.id).toBe('open');
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
    expect(filtered.filteredItems[0]!.id).toBe('split');
  });

  it('matches by shortcut', () => {
    const state = createCommandPaletteState(items);
    const filtered = cpFilter(state, 'ctrl+o');
    expect(filtered.filteredItems).toHaveLength(1);
    expect(filtered.filteredItems[0]!.id).toBe('open');
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
    for (let i = 0; i < items.length; i++) state = cpFocusNext(state);
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

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

describe('commandPalette render', () => {
  it('renders search line', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60 });
    expect(output).toContain('> ');
  });

  it('renders query in search line', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'save');
    const output = commandPalette(state, { width: 60 });
    expect(output.split('\n')[0]).toContain('> save');
  });

  it('shows focus indicator on focused item', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60 });
    const lines = output.split('\n');
    expect(lines[1]).toContain('\u25b8');
  });

  it('shows category when enabled', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60, showCategory: true });
    expect(output).toContain('[File]');
  });

  it('hides category when disabled', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60, showCategory: false });
    expect(output).not.toContain('[File]');
  });

  it('shows shortcut when enabled', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60, showShortcut: true });
    expect(output).toContain('Ctrl+O');
  });

  it('hides shortcut when disabled', () => {
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60, showShortcut: false });
    expect(output).not.toContain('Ctrl+O');
  });

  it('shows "No matches" when empty', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'zzzzz');
    const output = commandPalette(state, { width: 60 });
    expect(output).toContain('No matches');
  });

  it('clips "No matches" to width', () => {
    let state = createCommandPaletteState(items);
    state = cpFilter(state, 'zzzzz');
    const output = commandPalette(state, { width: 8 });
    const lines = output.split('\n');
    for (const line of lines) {
      expect(visibleLength(stripAnsi(line))).toBeLessThanOrEqual(8);
    }
  });

  it('respects viewport clipping (only shows items in viewport)', () => {
    const state = createCommandPaletteState(items, 2);
    const output = commandPalette(state, { width: 60 });
    const lines = output.split('\n');
    // 1 search line + 2 item lines = 3
    expect(lines).toHaveLength(3);
  });

  it('works with ctx (themed)', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const state = createCommandPaletteState(items);
    const output = commandPalette(state, { width: 60, ctx });
    expect(output).toContain('Open File');
    expect(output).toContain('[File]');
  });
});

// ---------------------------------------------------------------------------
// Keymap
// ---------------------------------------------------------------------------

describe('commandPaletteKeyMap', () => {
  const actions = {
    focusNext: 'next',
    focusPrev: 'prev',
    pageDown: 'pd',
    pageUp: 'pu',
    select: 'sel',
    close: 'close',
  };
  const km = commandPaletteKeyMap(actions);

  it('dispatches down/ctrl+n to focusNext', () => {
    expect(km.handle({ key: 'n', ctrl: true, alt: false, shift: false })).toBe('next');
    expect(km.handle({ key: 'down', ctrl: false, alt: false, shift: false })).toBe('next');
  });

  it('dispatches up/ctrl+p to focusPrev', () => {
    expect(km.handle({ key: 'p', ctrl: true, alt: false, shift: false })).toBe('prev');
    expect(km.handle({ key: 'up', ctrl: false, alt: false, shift: false })).toBe('prev');
  });

  it('dispatches pagedown/ctrl+d to pageDown', () => {
    expect(km.handle({ key: 'd', ctrl: true, alt: false, shift: false })).toBe('pd');
    expect(km.handle({ key: 'pagedown', ctrl: false, alt: false, shift: false })).toBe('pd');
  });

  it('dispatches pageup/ctrl+u to pageUp', () => {
    expect(km.handle({ key: 'u', ctrl: true, alt: false, shift: false })).toBe('pu');
    expect(km.handle({ key: 'pageup', ctrl: false, alt: false, shift: false })).toBe('pu');
  });

  it('dispatches enter to select', () => {
    expect(km.handle({ key: 'enter', ctrl: false, alt: false, shift: false })).toBe('sel');
  });

  it('dispatches escape to close', () => {
    expect(km.handle({ key: 'escape', ctrl: false, alt: false, shift: false })).toBe('close');
  });
});
