import {
  denseComparisonBlock, describe, expect, explorationListBlock, hierarchyBlock, it,
  modeAwarePrimitiveBlock, temporalDependencyBlock,
} from './standard-blocks.test-support.js';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import { createTextSurface } from './components/surface-text.js';
import { isSurfaceOutput } from './standard-blocks.test-support.part01.js';
import type { Surface } from '../ports/surface.js';
import { dataSlots, drawBlock, withoutSlots } from './standard-blocks-data-drawn.test-support.js';

const NESTED_FG = '#ff0055';
const nested = (): Surface => createTextSurface('nested', { fg: NESTED_FG });

/** The drawn output's cells, as `isSurfaceOutput` narrows them. */
interface CellGrid {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): { readonly char?: string; readonly fg?: string };
}

function drawSurface(block: typeof hierarchyBlock, slots: Readonly<Record<string, unknown>>, width = 60): CellGrid {
  const result = renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width } }));
  if (!isSurfaceOutput(result)) throw new Error('interactive output is not a Surface');
  return result.output;
}

/** Rows of `surface` where the six cells spelling `nested` all carry the nested Surface's colour. */
function nestedRuns(surface: CellGrid): number {
  let runs = 0;
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x + 6 <= surface.width; x += 1) {
      const cells = Array.from({ length: 6 }, (_, offset) => surface.get(x + offset, y));
      if (cells.map((cell) => cell.char).join('') === 'nested' && cells.every((cell) => cell.fg === NESTED_FG)) runs += 1;
    }
  }
  return runs;
}

/** Each word of a slot value: strings and numbers, and each entry of a list. */
function slotWords(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((item: unknown) => slotWords(item));
  if (typeof value === 'string' || typeof value === 'number') return String(value).split(/\s+/u).filter((word) => word !== '');
  return [];
}

const BLOCKS = [
  ['DenseComparisonBlock', denseComparisonBlock],
  ['HierarchyBlock', hierarchyBlock],
  ['ExplorationListBlock', explorationListBlock],
  ['TemporalDependencyBlock', temporalDependencyBlock],
  ['ModeAwarePrimitiveBlock', modeAwarePrimitiveBlock],
] as const;

describe('data block drawings keep Surface slot values (flyingrobots/bijou#940, R1)', () => {
  it.each([
    ['DenseComparisonBlock', 'left', denseComparisonBlock],
    ['HierarchyBlock', 'root', hierarchyBlock],
    ['ExplorationListBlock', 'facet', explorationListBlock],
    ['TemporalDependencyBlock', 'dependency', temporalDependencyBlock],
    ['ModeAwarePrimitiveBlock', 'primitive', modeAwarePrimitiveBlock],
  ] as const)('%s blits a Surface %s slot cell by cell, with its styling', (name, slot, block) => {
    const surface = drawSurface(block, { ...dataSlots(name), [slot]: nested() });

    expect(nestedRuns(surface)).toBe(1);
    expect(surface.width).toBe(60);
  });

  it.each([
    ['HierarchyBlock', 'nodes', hierarchyBlock],
    ['ExplorationListBlock', 'items', explorationListBlock],
    ['TemporalDependencyBlock', 'events', temporalDependencyBlock],
  ] as const)('%s blits a Surface entry of its %s list', (name, slot, block) => {
    const surface = drawSurface(block, { ...dataSlots(name), [slot]: ['first', nested()] });

    expect(nestedRuns(surface)).toBe(1);
  });

  it('clips a Surface slot wider than the row to the row', () => {
    const wide = createTextSurface(`nested${'w'.repeat(80)}`, { fg: NESTED_FG });
    const surface = drawSurface(hierarchyBlock, { ...dataSlots('HierarchyBlock'), root: wide }, 30);

    expect(surface.width).toBe(30);
    expect(nestedRuns(surface)).toBe(1);
  });
});

describe('data block drawings never clip slot text (flyingrobots/bijou#940, R2)', () => {
  it.each(BLOCKS)('%s shows every word of its DOGFOOD slots at width 30', (name, block) => {
    const slots = dataSlots(name);
    const text = drawBlock(block, slots, 30).rows.join(' ');
    const words = Object.values(slots).flatMap((value) => slotWords(value));

    expect(words.length).toBeGreaterThan(0);
    expect(words.filter((word) => !text.includes(word))).toEqual([]);
  });

  it.each(BLOCKS)('%s keeps a word longer than the row by breaking it across rows', (name, block) => {
    const long = 'q'.repeat(70);
    const firstText = Object.keys(dataSlots(name)).find((id) => typeof dataSlots(name)[id] === 'string') ?? '';
    const frame = drawBlock(block, { ...dataSlots(name), [firstText]: long }, 30);

    expect(frame.rows.join('').split('').filter((char) => char === 'q')).toHaveLength(70);
  });

  it('wraps the missing-slot text when it is longer than the row', () => {
    const frame = drawBlock(hierarchyBlock, withoutSlots(dataSlots('HierarchyBlock'), ['selected']), 30);
    const text = frame.rows.join(' ');

    expect(['(missing', 'required', 'selected)'].filter((word) => !text.includes(word))).toEqual([]);
  });
});

describe('data block drawings read raw slots safely (flyingrobots/bijou#940, R3)', () => {
  it.each([
    ['DenseComparisonBlock', 'metric', denseComparisonBlock],
    ['HierarchyBlock', 'nodes', hierarchyBlock],
    ['ExplorationListBlock', 'items', explorationListBlock],
    ['TemporalDependencyBlock', 'events', temporalDependencyBlock],
    ['ModeAwarePrimitiveBlock', 'value', modeAwarePrimitiveBlock],
  ] as const)('%s draws the missing-slot text when %s is a throwing getter', (name, slot, block) => {
    const slots = { ...withoutSlots(dataSlots(name), [slot]) };
    Object.defineProperty(slots, slot, { enumerable: true, get: () => { throw new Error('getter must not run'); } });

    const text = drawBlock(block, slots, 60).rows.join(' ');

    expect(text).toContain(`(missing required ${slot})`);
  });
});
