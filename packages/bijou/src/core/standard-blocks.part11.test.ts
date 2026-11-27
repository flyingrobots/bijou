import { describe, expect, it, linkDestinationBlock, pathProgressBlock, peerNavigationBlock, progressiveDisclosureBlock } from './standard-blocks.test-support.js';
import { framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import {
  DISCLOSURE, LINK, NAVIGATION_CASES, PATH, PEER, drawFrame, randomSlots, seededRandom, underRightToLeft, without,
} from './standard-blocks-navigation.test-support.js';

const at60 = (text: string): string => text.padEnd(60);
const endAt60 = (text: string): string => text.padStart(60);

describe('navigation blocks draw themselves in interactive mode (flyingrobots/bijou#938)', () => {
  it('draws PeerNavigation as previous, current and next on one row with route and status below', () => {
    expect(drawFrame(peerNavigationBlock, PEER).rows).toEqual([
      `← Architecture${' '.repeat(16)}Blocks${' '.repeat(16)}Method →`,
      at60('docs/blocks · available'),
    ]);
  });

  it('mirrors PeerNavigation under right-to-left: previous at the right edge, marks swapped', () => {
    expect(underRightToLeft(() => drawFrame(peerNavigationBlock, PEER)).rows).toEqual([
      `← Method${' '.repeat(16)}Blocks${' '.repeat(16)}Architecture →`,
      endAt60('available · docs/blocks'),
    ]);
  });

  it('draws PathProgress as a stepper with step of total and status', () => {
    expect(drawFrame(pathProgressBlock, PATH).rows).toEqual([
      at60('✓ Setup ── ● Blocks ── ○ Preview'),
      at60('Step 2 of 3 · current'),
    ]);
  });

  it('marks the PathProgress step named by current', () => {
    const rows = drawFrame(pathProgressBlock, { ...PATH, current: 'Preview', step: 3 }).rows;

    expect(rows[0]).toBe(at60('✓ Setup ── ✓ Blocks ── ● Preview'));
  });

  it('runs the PathProgress steps right to left from the right edge under right-to-left', () => {
    expect(underRightToLeft(() => drawFrame(pathProgressBlock, PATH)).rows).toEqual([
      endAt60('○ Preview ── ● Blocks ── ✓ Setup'),
      endAt60('current · Step 2 of 3'),
    ]);
  });

  it('puts PathProgress steps one per row when the stepper row does not fit', () => {
    const rows = drawFrame(pathProgressBlock, PATH, 30).rows;

    expect(rows.slice(0, 3).map((row) => row.trimEnd())).toEqual(['✓ Setup', '● Blocks', '○ Preview']);
  });

  it('draws a closed ProgressiveDisclosure with the hidden count and summary, hiding the details', () => {
    const rows = drawFrame(progressiveDisclosureBlock, DISCLOSURE).rows;

    expect(rows).toEqual([at60('▶ Advanced options · 6 hidden'), at60('  6 options hidden')]);
    expect(rows.join('\n')).not.toContain('debug traces');
  });

  it('draws an open ProgressiveDisclosure with each detail on its own indented row', () => {
    expect(drawFrame(progressiveDisclosureBlock, { ...DISCLOSURE, state: 'open' }).rows).toEqual([
      at60('▼ Advanced options · 6 shown'),
      at60('  debug traces'),
      at60('  layout facts'),
    ]);
  });

  it('puts the ProgressiveDisclosure marker after the label and mirrors it under right-to-left', () => {
    expect(underRightToLeft(() => drawFrame(progressiveDisclosureBlock, DISCLOSURE)).rows).toEqual([
      endAt60('6 hidden · Advanced options ◀'),
      endAt60('6 options hidden  '),
    ]);
  });

  it('draws LinkDestination as a link with its destination, then kind and status', () => {
    expect(drawFrame(linkDestinationBlock, LINK).rows).toEqual([
      at60('↗ DOGFOOD.md (docs/DOGFOOD.md)'),
      at60('docs · available'),
    ]);
  });

  it('moves the LinkDestination destination to its own row when the link row does not fit', () => {
    const rows = drawFrame(linkDestinationBlock, { ...LINK, destination: 'docs/guides/a-long-destination.md' }, 30).rows;

    expect(rows.map((row) => row.trimEnd())).toEqual(['↗ DOGFOOD.md', '  (docs/guides/a-long-destina…', 'docs · available']);
  });
});

describe.each(NAVIGATION_CASES)('$block.metadata.blockName drawn-output contract', (testCase) => {
  const { block, slots } = testCase;

  it('shows no framed box titled with a slot label', () => {
    expect(framedSlotTitles(block, drawFrame(block, slots))).toEqual([]);
  });

  it.each([30, 120])('fits width %i exactly on every row', (width) => {
    const frame = drawFrame(block, slots, width);

    expect(frame.width).toBe(width);
    expect(frame.rows.every((row) => row.length === width)).toBe(true);
    expect(framedSlotTitles(block, frame)).toEqual([]);
  });

  it('leaves out every optional slot that is absent', () => {
    const full = drawFrame(block, slots);
    const bare = drawFrame(block, without(slots, testCase.optional));
    const requiredText = Object.entries(slots)
      .filter(([key]) => !testCase.optional.includes(key))
      .map(([, value]) => String(value)).join(' ');

    expect(bare.height).toBeLessThanOrEqual(full.height);
    for (const key of testCase.optional) {
      const value = slots[key];
      if (typeof value === 'string' && !requiredText.includes(value)) {
        expect(bare.rows.join('\n')).not.toContain(value);
      }
    }
  });

  it('shows the missing-slot text inside the drawing when a required slot is absent', () => {
    const frame = drawFrame(block, without(slots, [testCase.required]));

    expect(frame.rows.join('\n')).toContain(`(missing required ${testCase.required})`);
    expect(framedSlotTitles(block, frame)).toEqual([]);
  });

  it('keeps pipe and accessible output and the slot facts unchanged', () => {
    const withoutMode = (facts: readonly { key: string }[] | undefined) => (facts ?? []).filter((fact) => !fact.key.includes('mode'));

    expect(block.render({ mode: 'pipe', slots }).output).toBe(testCase.pipe);
    expect(block.render({ mode: 'accessible', slots }).output).toBe(testCase.accessible);
    expect(withoutMode(block.render({ mode: 'interactive', slots }).facts))
      .toEqual(withoutMode(block.render({ mode: 'pipe', slots }).facts));
  });

  it('never throws and fits every width from 30 to 120 for seeded random slots', () => {
    const next = seededRandom(938);
    let witnesses = 0;
    for (let width = 30; width <= 120; width += 1) {
      const frame = drawFrame(block, randomSlots(testCase, next), width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => row.length === width && !row.includes('\x1b'))).toBe(true);
      witnesses += 1;
    }
    expect(witnesses).toBe(91);
  });
});
