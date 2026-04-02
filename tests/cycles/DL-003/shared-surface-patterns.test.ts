import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { readRepoFile } from '../repo.js';
import {
  createBrowsableListState,
  browsableListSurface,
} from '../../../packages/bijou-tui/src/browsable-list.js';
import {
  createCommandPaletteState,
  commandPaletteSurface,
} from '../../../packages/bijou-tui/src/command-palette.js';


describe('DL-003 shared surface pattern proof cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-003-prove-canonical-patterns-in-shared-surfaces.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('proves canonical selected-row background fill and one-cell inset in shared surfaces', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const selectedBg = ctx.surface('elevated').bg
      ?? ctx.surface('secondary').bg
      ?? ctx.surface('muted').bg;

    const list = browsableListSurface(createBrowsableListState({
      items: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana', description: 'Yellow fruit' },
      ],
      height: 2,
    }), { width: 24, ctx });

    expect(list.get(0, 0).bg).toBe(selectedBg);
    expect(list.get(1, 0).char).toBe('▸');
    expect(list.get(0, 1).bg).not.toBe(selectedBg);

    const palette = commandPaletteSurface(createCommandPaletteState([
      { id: 'open', label: 'Open File', category: 'File', shortcut: 'Ctrl+O' },
      { id: 'save', label: 'Save', category: 'File', shortcut: 'Ctrl+S' },
    ], 2), { width: 28, ctx });

    expect(palette.get(0, 0).char).toBe(' ');
    expect(palette.get(1, 0).char).toBe('>');
    expect(palette.get(0, 1).bg).toBe(selectedBg);
    expect(palette.get(1, 1).char).toBe('▸');
  });

  it('spawns the next design-language backlog item', () => {
    const cycle = readRepoFile('docs/design/DL-004-prove-drawer-rhythm-and-notice-rows.md');
    expect(cycle).toContain('# DL-004 — Prove Drawer Rhythm and Notice Rows');
  });
});
