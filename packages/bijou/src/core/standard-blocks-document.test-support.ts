import type { BlockDefinition } from './block-metadata.js';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import {
  brandEmphasisBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  framedGroupBlock,
} from './standard-blocks.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';

type Slots = Readonly<Record<string, unknown>>;

/** One document block with its DOGFOOD example slots and its lower-mode pins. */
interface DocumentBlockCase {
  readonly name: string;
  readonly block: BlockDefinition;
  readonly slots: Slots;
  readonly required: string;
  readonly optional: readonly string[];
  readonly pipe: string;
  readonly accessible: string;
}

const DOCUMENT_SLOTS: Slots = Object.freeze({
  heading: 'Blocks document',
  body: 'Use prose for persistent product truth.',
  callout: 'Lower modes keep the same heading and body facts.',
  code: 'block: FormattedDocumentBlock',
});

const WALKTHROUGH_SLOTS: Slots = Object.freeze({
  title: 'Why this changed',
  steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
  evidence: 'DF-040 playback',
  decision: 'keep grouped proof visible',
  nextStep: 'open lower-mode output',
});

const GROUP_SLOTS: Slots = Object.freeze({
  title: 'Release Checks',
  items: ['tests green', 'docs updated', 'PR linked'],
  selected: 'tests green',
  mode: 'review',
});

const BRAND_SLOTS: Slots = Object.freeze({
  brand: 'BIJOU',
  tagline: 'Terminal-native app blocks',
  decoration: 'accent rule',
  role: 'nonessential',
  selected: 'BIJOU',
});

const DOCUMENT_BLOCK_CASES: readonly DocumentBlockCase[] = Object.freeze([
  {
    name: 'FormattedDocumentBlock',
    block: formattedDocumentBlock,
    slots: DOCUMENT_SLOTS,
    required: 'body',
    optional: ['callout', 'code'],
    pipe: 'FormattedDocumentBlock\nheading: Blocks document\nbody: Use prose for persistent product truth.\n'
      + 'callout: Lower modes keep the same heading and body facts.\ncode: block: FormattedDocumentBlock',
    accessible: 'FormattedDocumentBlock\nHeading: Blocks document\nBody: Use prose for persistent product truth.\n'
      + 'Callout: Lower modes keep the same heading and body facts.\nCode: block: FormattedDocumentBlock',
  },
  {
    name: 'ExplainabilityWalkthroughBlock',
    block: explainabilityWalkthroughBlock,
    slots: WALKTHROUGH_SLOTS,
    required: 'steps',
    optional: ['evidence', 'decision', 'nextStep'],
    pipe: 'ExplainabilityWalkthroughBlock\ntitle: Why this changed\n'
      + 'steps: input changed; constraint tightened; preview re-rendered\nevidence: DF-040 playback\n'
      + 'decision: keep grouped proof visible\nnextStep: open lower-mode output',
    accessible: 'ExplainabilityWalkthroughBlock\nTitle: Why this changed\n'
      + 'Steps: input changed; constraint tightened; preview re-rendered\nEvidence: DF-040 playback\n'
      + 'Decision: keep grouped proof visible\nNext step: open lower-mode output',
  },
  {
    name: 'FramedGroupBlock',
    block: framedGroupBlock,
    slots: GROUP_SLOTS,
    required: 'items',
    optional: ['selected', 'mode'],
    pipe: 'FramedGroupBlock\ntitle: Release Checks\nitems: tests green; docs updated; PR linked\n'
      + 'selected: tests green\nmode: review',
    accessible: 'FramedGroupBlock\nTitle: Release Checks\nItems: tests green; docs updated; PR linked\n'
      + 'Selected: tests green\nMode: review',
  },
  {
    name: 'BrandEmphasisBlock',
    block: brandEmphasisBlock,
    slots: BRAND_SLOTS,
    required: 'tagline',
    optional: ['role', 'selected'],
    pipe: 'BrandEmphasisBlock\nbrand: BIJOU\ntagline: Terminal-native app blocks\ndecoration: accent rule\n'
      + 'role: nonessential\nselected: BIJOU',
    accessible: 'BrandEmphasisBlock\nBrand: BIJOU\nTagline: Terminal-native app blocks\n'
      + 'Decoration: accent rule\nRole: nonessential\nSelected: BIJOU',
  },
]);

function drawBlock(block: BlockDefinition, slots: Slots, width = 60): DrawnFrame {
  return drawnFrame(renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width } })));
}

function withoutSlots(slots: Slots, ids: readonly string[]): Slots {
  return Object.fromEntries(Object.entries(slots).filter(([id]) => !ids.includes(id)));
}

/** Rows that open a box frame (`┌`), anywhere in the row. */
function frameTops(frame: DrawnFrame): readonly string[] {
  return frame.rows.filter((row) => row.includes('┌'));
}

/** The case for block `name`; throws when the table has no such block. */
function documentBlockCase(name: string): DocumentBlockCase {
  const found = DOCUMENT_BLOCK_CASES.find((entry) => entry.name === name);
  if (found === undefined) throw new Error(`no document block case named ${name}`);
  return found;
}

const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Terminal cells in one drawn row: one per grapheme, as the Surface stores them. */
function cellCount(row: string): number {
  return Array.from(GRAPHEMES.segment(row)).length;
}

export type { DocumentBlockCase };
export { DOCUMENT_BLOCK_CASES, cellCount, documentBlockCase, drawBlock, frameTops, withoutSlots };
