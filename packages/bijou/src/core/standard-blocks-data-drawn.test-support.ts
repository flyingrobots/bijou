import type { BlockDefinition } from './block-metadata.js';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';

type Slots = Readonly<Record<string, unknown>>;

/** The DOGFOOD example slots (`examples/docs/app-standard-block-preview-structure.ts`, English copy). */
const DATA_SLOTS: Readonly<Record<string, Slots>> = Object.freeze({
  DenseComparisonBlock: { title: 'Compare packages', metric: 'tests', left: '1820', right: '640', delta: '+12', selected: 'tests' },
  HierarchyBlock: { root: 'docs/', nodes: ['design/', 'DX-031.md', 'METHOD.md'], selected: 'design/', parent: 'docs/', depth: 1, expanded: 'true' },
  ExplorationListBlock: { title: 'Explore components', facet: 'input', items: ['TextEntry field input', 'SingleChoice radio/select'], selected: 'TextEntry', preview: 'field input' },
  TemporalDependencyBlock: { title: 'Timeline', events: ['09:00 build', '09:05 test', '09:10 publish'], dependency: 'publish waits for test', selected: 'publish', dependsOn: 'test' },
  ModeAwarePrimitiveBlock: { primitive: 'metric badge', fact: 'latency-ms', value: 42, status: 'good', modeContract: 'visual and pipe', selected: 'metric badge' },
});

function dataSlots(blockName: string): Slots {
  const slots = DATA_SLOTS[blockName];
  if (slots === undefined) throw new Error(`no DOGFOOD slots for ${blockName}`);
  return slots;
}

function withoutSlots(slots: Slots, ids: readonly string[]): Slots {
  return Object.fromEntries(Object.entries(slots).filter(([id]) => !ids.includes(id)));
}

function drawBlock(block: BlockDefinition, slots: Slots, width = 60, mode: 'interactive' | 'static' = 'interactive'): DrawnFrame {
  return drawnFrame(renderBlockTree(blockRenderNode(block, { mode, slots, config: { width } })));
}

/** Rows that carry the selection marker. */
function markedRows(frame: DrawnFrame): readonly string[] {
  return frame.rows.filter((row) => row.includes('▸'));
}

/** A deterministic LCG (Numerical Recipes constants); the seed is printed on failure by the caller. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

const ALPHABET = ['a', 'Z', '0', ' ', '/', '-', '.', 'é', '─', '\n', '\t', '\u001b[31m', '\u0007'];

function randomText(next: () => number): string {
  const length = next() % 90;
  let text = '';
  for (let index = 0; index < length; index += 1) {
    text += ALPHABET[next() % ALPHABET.length] ?? '';
  }
  return text;
}

function randomList(next: () => number): readonly string[] {
  return Array.from({ length: next() % 6 }, () => randomText(next));
}

/** Slot kinds per block, from the schema types in `standard-blocks/types.part0{2,3}.ts`. */
const SLOT_KINDS: Readonly<Record<string, Readonly<Record<string, 'text' | 'list' | 'textOrNumber'>>>> = Object.freeze({
  DenseComparisonBlock: { title: 'text', metric: 'text', left: 'textOrNumber', right: 'textOrNumber', delta: 'textOrNumber', selected: 'text' },
  HierarchyBlock: { root: 'text', nodes: 'list', selected: 'text', parent: 'text', depth: 'textOrNumber', expanded: 'text' },
  ExplorationListBlock: { title: 'text', facet: 'text', items: 'list', selected: 'text', preview: 'text' },
  TemporalDependencyBlock: { title: 'text', events: 'list', dependency: 'text', selected: 'text', dependsOn: 'text' },
  ModeAwarePrimitiveBlock: { primitive: 'text', fact: 'text', value: 'textOrNumber', status: 'text', modeContract: 'text', selected: 'text' },
});

/** Random slots within the block's schema; each slot is left out one time in four. */
function randomSlots(blockName: string, next: () => number): Slots {
  const kinds = SLOT_KINDS[blockName] ?? {};
  const slots: Record<string, unknown> = {};
  for (const [id, kind] of Object.entries(kinds)) {
    if (next() % 4 === 0) continue;
    if (kind === 'list') slots[id] = randomList(next);
    else if (kind === 'textOrNumber' && next() % 2 === 0) slots[id] = (next() % 200000) - 100000;
    else slots[id] = randomText(next);
  }
  return slots;
}

/** Control characters (below U+0020, and U+007F) found in drawn rows. */
function controlCharacters(rows: readonly string[]): readonly string[] {
  const found: string[] = [];
  for (const char of rows.join('')) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) found.push(char);
  }
  return found;
}

/**
 * Pipe and accessible output for the DOGFOOD slots, as the shared section renderer
 * writes them (`render.part01.ts`: block name, then `id: text` or `Label: text` per slot).
 */
const LOWER_MODE_OUTPUT: Readonly<Record<string, Readonly<Record<'pipe' | 'accessible', readonly string[]>>>> = Object.freeze({
  DenseComparisonBlock: {
    pipe: ['title: Compare packages', 'metric: tests', 'left: 1820', 'right: 640', 'delta: +12', 'selected: tests'],
    accessible: ['Title: Compare packages', 'Metric: tests', 'Left: 1820', 'Right: 640', 'Delta: +12', 'Selected: tests'],
  },
  HierarchyBlock: {
    pipe: ['root: docs/', 'nodes: design/; DX-031.md; METHOD.md', 'selected: design/', 'parent: docs/', 'depth: 1', 'expanded: true'],
    accessible: ['Root: docs/', 'Nodes: design/; DX-031.md; METHOD.md', 'Selected: design/', 'Parent: docs/', 'Depth: 1', 'Expanded: true'],
  },
  ExplorationListBlock: {
    pipe: ['title: Explore components', 'facet: input', 'items: TextEntry field input; SingleChoice radio/select', 'selected: TextEntry', 'preview: field input'],
    accessible: ['Title: Explore components', 'Facet: input', 'Items: TextEntry field input; SingleChoice radio/select', 'Selected: TextEntry', 'Preview: field input'],
  },
  TemporalDependencyBlock: {
    pipe: ['title: Timeline', 'events: 09:00 build; 09:05 test; 09:10 publish', 'dependency: publish waits for test', 'selected: publish', 'dependsOn: test'],
    accessible: ['Title: Timeline', 'Events: 09:00 build; 09:05 test; 09:10 publish', 'Dependency: publish waits for test', 'Selected: publish', 'Depends on: test'],
  },
  ModeAwarePrimitiveBlock: {
    pipe: ['primitive: metric badge', 'fact: latency-ms', 'value: 42', 'status: good', 'modeContract: visual and pipe', 'selected: metric badge'],
    accessible: ['Primitive: metric badge', 'Fact: latency-ms', 'Value: 42', 'Status: good', 'Mode contract: visual and pipe', 'Selected: metric badge'],
  },
});

function lowerModeOutput(blockName: string, mode: 'pipe' | 'accessible'): string {
  const lines = LOWER_MODE_OUTPUT[blockName]?.[mode];
  if (lines === undefined) throw new Error(`no ${mode} output for ${blockName}`);
  return [blockName, ...lines].join('\n');
}

export { controlCharacters, dataSlots, drawBlock, lcg, lowerModeOutput, markedRows, randomSlots, withoutSlots };
