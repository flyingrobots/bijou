import type { BlockDefinition } from './block-metadata.js';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';
import {
  activityStreamBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  progressIndicatorBlock,
  shortcutCueBlock,
  transientOverlayBlock,
} from './standard-blocks.js';

type Slots = Readonly<Record<string, unknown>>;

/** One status block, its DOGFOOD example slots, and its width-60 drawing. */
interface StatusCase {
  readonly block: BlockDefinition;
  readonly slots: Slots;
  readonly golden: readonly string[];
  readonly optional: readonly string[];
  /** The width-60 drawing with every optional slot left out. */
  readonly bare: readonly string[];
}

const pad = (text: string, width = 60): string => text.padEnd(width);
const framed = (lines: readonly string[]): readonly string[] => [
  '<top>',
  ...lines.map((line) => `│${line}│`),
  '<bottom>',
];

/** The example slots of `examples/docs/app-standard-block-preview-status.ts`. */
const STATUS_CASES: readonly StatusCase[] = [
  {
    block: inlineStatusBlock,
    slots: { label: 'Docs inventory', status: 'ready', message: 'catalog synced' },
    golden: [pad(' ready  Docs inventory · catalog synced')],
    optional: ['message'],
    bare: [pad(' ready  Docs inventory')],
  },
  {
    block: inFlowStatusBlock,
    slots: {
      severity: 'warning',
      source: 'DOGFOOD Blocks',
      message: 'Preview data should stay explicit.',
      action: 'Open story',
    },
    golden: framed([
      `⚠ ${pad('Preview data should stay explicit.', 56)}`,
      `  ${pad('DOGFOOD Blocks · Open story', 56)}`,
    ]),
    optional: ['source', 'action'],
    bare: framed([`⚠ ${pad('Preview data should stay explicit.', 56)}`]),
  },
  {
    block: transientOverlayBlock,
    slots: { priority: 'normal', message: 'Saved DOGFOOD route', dismiss: 'Esc dismisses' },
    golden: framed([
      ` ${pad(' normal  Saved DOGFOOD route', 56)} `,
      ` ${pad('Esc dismisses', 56)} `,
    ]),
    optional: ['priority', 'dismiss'],
    bare: framed([` ${pad('Saved DOGFOOD route', 56)} `]),
  },
  {
    block: activityStreamBlock,
    slots: { events: ['10:41 tests passed', '10:42 PR opened'], selected: '10:41 tests passed' },
    golden: [pad('▸ 10:41 tests passed'), pad('  10:42 PR opened')],
    optional: ['selected'],
    bare: [pad('  10:41 tests passed'), pad('  10:42 PR opened')],
  },
  {
    block: shortcutCueBlock,
    slots: { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'Blocks page' },
    golden: [pad('Blocks page │ [ / ] Search  [ ? ] Help  [ Esc ] Close')],
    optional: ['scope'],
    bare: [pad('[ / ] Search  [ ? ] Help  [ Esc ] Close')],
  },
  {
    block: progressIndicatorBlock,
    slots: { label: 'Install packages', value: '3', total: '5', percent: '60%' },
    golden: [`${'Install packages'.padEnd(57)}3/5`, ` 60% ${'█'.repeat(33)}${'⠐'.repeat(22)}`],
    optional: ['value', 'total'],
    bare: [pad('Install packages'), ` 60% ${'█'.repeat(33)}${'⠐'.repeat(22)}`],
  },
];

/** Rows with text-presentation selectors removed and box borders named, for golden comparison. */
function comparableRows(frame: DrawnFrame): readonly string[] {
  return frame.rows.map((row) => row.replace(/︎/gu, ''))
    .map((row) => (/^[┌╭]─+[┐╮]$/u.test(row) ? '<top>' : /^[└╰]─+[┘╯]$/u.test(row) ? '<bottom>' : row));
}

function drawStatus(block: BlockDefinition, slots: Slots, width = 60, mode: 'interactive' | 'static' = 'interactive'): DrawnFrame {
  return drawnFrame(renderBlockTree(blockRenderNode(block, { mode, slots, config: { width } })));
}

/** Terminal columns of a drawn row: one per grapheme, since the drawings use narrow text only. */
function columns(row: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(row)].length;
}

function omit(slots: Slots, keys: readonly string[]): Slots {
  return Object.fromEntries(Object.entries(slots).filter(([key]) => !keys.includes(key)));
}

/** Deterministic linear congruential generator; never `Math.random`. */
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

const FUZZ_PIECES = ['a', 'Z', '7', ' ', '-', '/', '%', '·', 'é', '│', '\u001b[31m', '\u0007', '\n', 'Esc', '60'];

function fuzzText(next: () => number): string {
  let text = '';
  const length = next() % 40;
  for (let index = 0; index < length; index += 1) {
    text += FUZZ_PIECES[next() % FUZZ_PIECES.length] ?? '';
  }
  return text;
}

/** Random slot values within each slot's schema: text, text lists, or a percent; a fifth are left out. */
function fuzzSlots(block: BlockDefinition, next: () => number): Slots {
  const listSlots = new Set(['events', 'shortcuts']);
  const entries = block.metadata.slots.flatMap((slot): [string, unknown][] => {
    if (next() % 5 === 0) return [];
    if (listSlots.has(slot.id)) {
      return [[slot.id, Array.from({ length: next() % 7 }, () => fuzzText(next))]];
    }
    if (slot.id === 'percent') {
      const choice = next() % 3;
      const value = (next() % 240) - 70;
      return [[slot.id, choice === 0 ? value : choice === 1 ? `${String(value)}%` : fuzzText(next)]];
    }
    return [[slot.id, fuzzText(next)]];
  });
  return Object.fromEntries(entries);
}

export type { StatusCase };
export { STATUS_CASES, columns, comparableRows, drawStatus, fuzzSlots, lcg, omit };
