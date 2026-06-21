import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { visibleLength, stripAnsi } from './viewport.js';
import { createCommandPaletteState, cpFilter, cpFocusNext, commandPalette, commandPaletteSurface } from './command-palette.js';
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
// Render
// ---------------------------------------------------------------------------

describe('commandPalette render', () => {
  const ctx = createTestContext();

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

  it('renders a surface with a fixed search line and results viewport', () => {
    const surface = commandPaletteSurface(
      createCommandPaletteState(items, 2),
      { width: 40, ctx },
    );
    const rendered = stripAnsi(surfaceToString(surface, ctx.style));
    const lines = rendered.split('\n');

    expect(surface.width).toBe(40);
    expect(surface.height).toBe(3);
    expect(lines[0]).toContain('> ');
    expect(lines[1]).toContain('Open File');
    expect(lines[2]).toContain('Save');
  });

  it('uses canonical inset rhythm and full-row selection in the surface path', () => {
    const interactiveCtx = createTestContext({ mode: 'interactive' });
    const surface = commandPaletteSurface(
      createCommandPaletteState(items, 2),
      { width: 40, ctx: interactiveCtx },
    );

    expect(surface.get(0, 0).char).toBe(' ');
    expect(surface.get(1, 0).char).toBe('>');
    expect(surface.get(0, 1).bg).toBe(interactiveCtx.surface('elevated').bg);
    expect(surface.get(1, 1).char).toBe('\u25b8');
  });

  it('surface path follows the shared viewport scroll window', () => {
    let state = createCommandPaletteState(items, 2);
    state = cpFocusNext(state);
    state = cpFocusNext(state);

    const rendered = stripAnsi(surfaceToString(
      commandPaletteSurface(state, { width: 40, ctx }),
      ctx.style,
    ));

    expect(rendered).not.toContain('Open File');
    expect(rendered).toContain('Save');
    expect(rendered).toContain('Close Tab');
  });
});
