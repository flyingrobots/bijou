import { describe, expect, it } from 'vitest';

import { framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import {
  DOCUMENT_BLOCK_CASES,
  cellCount,
  documentBlockCase,
  drawBlock,
  frameTops,
  withoutSlots,
} from './standard-blocks-document.test-support.js';

const documentCase = documentBlockCase('FormattedDocumentBlock');
const walkthroughCase = documentBlockCase('ExplainabilityWalkthroughBlock');
const groupCase = documentBlockCase('FramedGroupBlock');
const brandCase = documentBlockCase('BrandEmphasisBlock');
const ESCAPE = String.fromCharCode(0x1b);
const FUZZ_PIECES = ['alpha', 'beta gamma', 'a-much-longer-unbroken-token-for-wrapping', `${ESCAPE}[31mred`, 'x\ny', '  ', '', 'é'];

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

describe.each(DOCUMENT_BLOCK_CASES)('$name interactive drawing (flyingrobots/bijou#939)', (entry) => {
  it('shows no framed box titled with a slot label', () => {
    expect(framedSlotTitles(entry.block, drawBlock(entry.block, entry.slots))).toEqual([]);
  });

  it.each([30, 60, 120])('fits width %i exactly on every row', (width) => {
    const frame = drawBlock(entry.block, entry.slots, width);
    expect(frame.width).toBe(width);
    expect(frame.rows.every((row) => cellCount(row) === width)).toBe(true);
  });

  it('leaves absent optional slots out of the drawing', () => {
    const frame = drawBlock(entry.block, withoutSlots(entry.slots, entry.optional));
    expect(framedSlotTitles(entry.block, frame)).toEqual([]);
    expect(frame.rows.some((row) => row.includes('(missing'))).toBe(false);
  });

  it('shows the missing-slot text inside the drawing when a required slot is absent', () => {
    const frame = drawBlock(entry.block, withoutSlots(entry.slots, [entry.required]));
    expect(frame.rows.some((row) => row.includes(`(missing required ${entry.required})`))).toBe(true);
    expect(framedSlotTitles(entry.block, frame)).toEqual([]);
  });

  it('keeps pipe and accessible output as labelled slot lines', () => {
    expect(entry.block.render({ mode: 'pipe', slots: entry.slots }).output).toBe(entry.pipe);
    expect(entry.block.render({ mode: 'accessible', slots: entry.slots }).output).toBe(entry.accessible);
  });

  it('fits the requested width for seeded random slot values without control bytes', () => {
    const next = seeded(939);
    let witnesses = 0;
    for (let round = 0; round < 60; round += 1) {
      const width = 30 + (next() % 91);
      const slots = Object.fromEntries(Object.keys(entry.slots).map((id) => {
        const pieces = Array.from({ length: next() % 4 }, () => FUZZ_PIECES[next() % FUZZ_PIECES.length] ?? '');
        return [id, next() % 3 === 0 ? pieces : pieces.join(' ')];
      }));
      const frame = drawBlock(entry.block, slots, width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => cellCount(row) === width && !row.includes(ESCAPE))).toBe(true);
      witnesses += 1;
    }
    expect(witnesses).toBe(60);
  });
});

describe('document block drawn structure at width 60 (flyingrobots/bijou#939)', () => {
  it('draws FormattedDocumentBlock as heading, body, callout and code block', () => {
    const rows = drawBlock(documentCase.block, documentCase.slots).rows;
    expect(rows[0]?.trimEnd()).toBe('Blocks document');
    expect(rows).toContain('Use prose for persistent product truth.'.padEnd(60));
    expect(rows.some((row) => /^│ℹ︎? Lower modes keep the same heading and body facts\. +│$/u.test(row))).toBe(true);
    expect(rows.at(-1)?.trimEnd()).toBe('  block: FormattedDocumentBlock');
  });

  it('draws the FormattedDocumentBlock code slot as a code block, not as prose', () => {
    const longLine = 'x'.repeat(100);
    const rows = drawBlock(documentCase.block, { ...documentCase.slots, body: longLine, code: `if (ready) {\n  ship();\n}\n${longLine}` }).rows;
    expect(rows.filter((row) => row.startsWith('x')).length).toBeGreaterThan(1);
    expect(rows.slice(-4).map((row) => row.trimEnd())).toEqual(['  if (ready) {', '    ship();', '  }', `  ${'x'.repeat(58)}`]);
  });

  it('draws ExplainabilityWalkthroughBlock as numbered steps with evidence, decision and next step', () => {
    const rows = drawBlock(walkthroughCase.block, walkthroughCase.slots).rows.map((row) => row.trimEnd());
    expect(rows).toEqual([
      'Why this changed',
      '',
      '1. input changed',
      '2. constraint tightened',
      '3. preview re-rendered',
      '',
      'Evidence: DF-040 playback',
      'Decision: keep grouped proof visible',
      'Next step: open lower-mode output',
    ]);
  });

  it('draws FramedGroupBlock as exactly one frame titled with its title value', () => {
    const frame = drawBlock(groupCase.block, groupCase.slots);
    expect(frameTops(frame)).toHaveLength(1);
    expect(frame.rows[0]).toMatch(/^┌─ Release Checks ─+┐$/u);
    expect(frame.rows.slice(1, -1).map((row) => row.slice(0, 20).trimEnd())).toEqual([
      '│ › tests green',
      '│   docs updated',
      '│   PR linked',
      '│   Mode: review',
    ]);
    expect(frame.rows.at(-1)).toMatch(/^└─+┘$/u);
  });

  it('marks no FramedGroupBlock item when nothing is selected, and still draws one frame', () => {
    const frame = drawBlock(groupCase.block, withoutSlots(groupCase.slots, ['selected']));
    expect(frameTops(frame)).toHaveLength(1);
    expect(frame.rows.some((row) => row.includes('›'))).toBe(false);
  });

  it('draws BrandEmphasisBlock as the brand over an accent rule and the tagline', () => {
    const rows = drawBlock(brandCase.block, brandCase.slots).rows;
    expect(rows.map((row) => row.trimEnd())).toEqual(['BIJOU', '━'.repeat(60), 'Terminal-native app blocks']);
  });

  it('shows the missing decoration text inside the BrandEmphasisBlock accent rule', () => {
    const rows = drawBlock(brandCase.block, withoutSlots(brandCase.slots, ['decoration'])).rows;
    expect(rows[1]).toMatch(/^━+ \(missing required decoration\) ━+$/u);
  });
});
