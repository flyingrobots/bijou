import { describe, expect, explorationListBlock, hierarchyBlock, it } from './standard-blocks.test-support.js';
import { createTextSurface } from './components/surface-text.js';
import { dataSlots, drawBlock, markedRows } from './standard-blocks-data-drawn.test-support.js';

const AMBIGUOUS = ['Not Done', 'Done later'];

describe('data block drawings show a selection that marks no entry (flyingrobots/bijou#940)', () => {
  it('shows a HierarchyBlock selection that names no node as its own row', () => {
    const frame = drawBlock(hierarchyBlock, { ...dataSlots('HierarchyBlock'), selected: 'design' });

    expect(markedRows(frame)).toEqual([]);
    expect(frame.rows.filter((row) => row.trimEnd() === 'Selected: design')).toHaveLength(1);
  });

  it.each([
    ['HierarchyBlock', 'nodes', hierarchyBlock],
    ['ExplorationListBlock', 'items', explorationListBlock],
  ] as const)('%s marks no %s entry when two entries match the selection only loosely', (name, slot, block) => {
    const frame = drawBlock(block, { ...dataSlots(name), [slot]: AMBIGUOUS, selected: 'Done' });

    expect(markedRows(frame)).toEqual([]);
    expect(frame.rows.filter((row) => row.trimEnd() === 'Selected: Done')).toHaveLength(1);
  });

  it('marks the one entry that matches the selection loosely, as the DOGFOOD slots need', () => {
    const frame = drawBlock(explorationListBlock, dataSlots('ExplorationListBlock'));

    expect(markedRows(frame).map((row) => row.trimEnd())).toEqual(['▸ TextEntry field input']);
    expect(frame.rows.some((row) => row.startsWith('Selected:'))).toBe(false);
  });

  it.each([
    ['HierarchyBlock', hierarchyBlock],
    ['ExplorationListBlock', explorationListBlock],
  ] as const)('%s blits a Surface selection, which marks no entry, as its own row', (name, block) => {
    const frame = drawBlock(block, { ...dataSlots(name), selected: createTextSurface('picked') });

    expect(markedRows(frame)).toEqual([]);
    expect(frame.rows.filter((row) => row.trimEnd() === 'Selected: picked')).toHaveLength(1);
  });
});
