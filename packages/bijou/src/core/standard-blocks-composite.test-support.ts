import type { BlockDefinition } from './block-metadata.js';
import { createSurface, type Surface } from '../ports/surface.js';
import {
  appShellBlock,
  blockRenderNode,
  inspectorPanelBlock,
  readerSurfaceBlock,
  renderBlockTree,
} from './standard-blocks.test-support.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';

type Slots = Readonly<Record<string, unknown>>;

/** The DOGFOOD Blocks page example slots (`examples/docs/app-standard-block-preview-core.ts`). */
const READER_SLOTS: Slots = Object.freeze({
  content: 'ReaderSurface live content from DOGFOOD Blocks.',
  navigation: 'Blocks navigation',
  outline: ['What are Blocks', 'How Blocks Lower'],
});
const INSPECTOR_SLOTS: Slots = Object.freeze({
  selection: 'ReaderSurface',
  details: ['schema-bound', 'provider-ready', 'command-aware'],
  actions: ['Reveal selection', 'Focus source'],
});
const SHELL_SLOTS: Slots = Object.freeze({
  navigation: 'Guides / Components / Blocks',
  content: blockRenderNode(readerSurfaceBlock, {
    config: { width: 58, sectionHeight: 4 },
    slots: { content: 'ReaderSurface live content from DOGFOOD Blocks.' },
  }),
  inspector: blockRenderNode(inspectorPanelBlock, {
    config: { width: 58, sectionHeight: 4 },
    slots: { selection: 'ReaderSurface', details: ['schema-bound', 'provider-ready', 'command-aware'] },
  }),
  status: 'ready',
  overlays: [],
});

/** One composite block under test, with its DOGFOOD slots and its edges. */
interface CompositeCase {
  readonly block: BlockDefinition;
  readonly sectionHeight: number;
  readonly dogfood: Slots;
  readonly required: Slots;
  readonly missingText: string;
  readonly fuzz: (next: () => number) => Slots;
}

const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'release', 'evidence', 'x', 'a-very-long-unbroken-token-value'];

function words(next: () => number, count: number): string {
  return Array.from({ length: count }, () => WORDS[next() % WORDS.length] ?? 'x').join(' ');
}

function list(next: () => number): readonly string[] {
  return Array.from({ length: next() % 5 }, () => words(next, 1 + (next() % 4)));
}

function surfaceValue(next: () => number): Surface {
  const surface = createSurface(1 + (next() % 150), 1 + (next() % 12));
  surface.set(0, 0, { char: 'S' });
  return surface;
}

function maybe(next: () => number, value: () => unknown): unknown {
  const roll = next() % 4;
  return roll === 0 ? undefined : roll === 1 ? surfaceValue(next) : value();
}

const COMPOSITE_CASES: readonly CompositeCase[] = [
  {
    block: appShellBlock,
    sectionHeight: 8,
    dogfood: SHELL_SLOTS,
    required: { content: 'Blocks guide' },
    missingText: '(missing required content)',
    fuzz: (next) => ({
      navigation: maybe(next, () => words(next, next() % 9)),
      content: maybe(next, () => words(next, next() % 30)),
      inspector: maybe(next, () => words(next, next() % 12)),
      status: maybe(next, () => words(next, next() % 6)),
      overlays: maybe(next, () => list(next)),
    }),
  },
  {
    block: readerSurfaceBlock,
    sectionHeight: 5,
    dogfood: READER_SLOTS,
    required: { content: 'Blocks guide' },
    missingText: '(missing required content)',
    fuzz: (next) => ({
      navigation: maybe(next, () => words(next, next() % 9)),
      content: maybe(next, () => words(next, next() % 40)),
      outline: maybe(next, () => list(next)),
    }),
  },
  {
    block: inspectorPanelBlock,
    sectionHeight: 5,
    dogfood: INSPECTOR_SLOTS,
    required: { selection: 'ReaderSurface' },
    missingText: '(missing required selection)',
    fuzz: (next) => ({
      selection: maybe(next, () => words(next, next() % 8)),
      details: maybe(next, () => list(next)),
      actions: maybe(next, () => list(next)),
    }),
  },
];

/** Renders `block` through the block tree, so nested block nodes become Surfaces. */
function drawComposite(
  block: BlockDefinition,
  slots: Slots,
  config: Slots,
  mode: 'interactive' | 'static' = 'interactive',
): DrawnFrame {
  return drawnFrame(renderBlockTree(blockRenderNode(block, { mode, slots, config })));
}

/** A deterministic linear congruential generator. */
function seededNext(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

const REGION_LABELS = ['Navigation', 'Content', 'Inspector', 'Status', 'Overlays', 'Outline', 'Selection', 'Details', 'Actions'];

/** Region labels that appear as a framed box title (`─ Label ─`) in `frame`. */
function framedRegionTitles(frame: DrawnFrame): readonly string[] {
  return REGION_LABELS.filter((label) => frame.rows.some((row) => row.includes(`─ ${label} ─`)));
}

/** One framed inner row: `│ ` + `text` padded to `inner` columns + ` │`. */
function framedRow(text: string, inner: number): string {
  return `│ ${text.padEnd(inner, ' ')} │`;
}

export type { CompositeCase };
export { COMPOSITE_CASES, INSPECTOR_SLOTS, READER_SLOTS, SHELL_SLOTS, drawComposite, framedRegionTitles, framedRow, seededNext };
