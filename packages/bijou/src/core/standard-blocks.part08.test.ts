import {
  blockRenderNode,
  describe,
  dividerBlock,
  expect,
  it,
  renderBlockTree,
  textEntryBlock,
} from './standard-blocks.test-support.js';
import { drawnFrame, framedSlotTitles } from './standard-blocks-drawn.test-support.js';

const RELEASE_SLOTS = Object.freeze({ label: 'Release Evidence', style: 'rule', density: 'compact' });

function drawDivider(slots: Readonly<Record<string, unknown>>, width = 60) {
  return drawnFrame(renderBlockTree(blockRenderNode(dividerBlock, {
    mode: 'interactive',
    slots,
    config: { width },
  })));
}

describe('DividerBlock interactive drawing (flyingrobots/bijou#935)', () => {
  it('draws one separator row that carries the label at the requested width', () => {
    const frame = drawDivider(RELEASE_SLOTS);

    expect(frame.width).toBe(60);
    expect(frame.height).toBe(1);
    expect(frame.rows[0]).toMatch(/^─+ Release Evidence ─+$/u);
  });

  it('shows no framed box titled with a Divider slot label', () => {
    expect(framedSlotTitles(dividerBlock, drawDivider(RELEASE_SLOTS))).toEqual([]);
  });

  it('adds a blank row above and below the rule when density is spacious', () => {
    const frame = drawDivider({ ...RELEASE_SLOTS, density: 'spacious' });

    expect(frame.height).toBe(3);
    expect(frame.rows[0]?.trim()).toBe('');
    expect(frame.rows[1]).toContain(' Release Evidence ');
    expect(frame.rows[2]?.trim()).toBe('');
  });

  it('draws the double style with double-line glyphs only', () => {
    const row = drawDivider({ ...RELEASE_SLOTS, style: 'double' }).rows[0] ?? '';

    expect(row).toMatch(/^═+ Release Evidence ═+$/u);
  });

  it('restyles only the rule, never a rule glyph inside the label', () => {
    const row = drawDivider({ label: 'A ─ B', style: 'double' }).rows[0] ?? '';

    expect(row).toMatch(/^═+ A ─ B ═+$/u);
  });

  it('draws the missing-label text inside the rule when the required label is absent', () => {
    const frame = drawDivider({ style: 'rule' });

    expect(frame.rows[0]).toContain(' (missing required label) ');
    expect(frame.rows[0]).toMatch(/^─/u);
  });

  it('fits the narrowest width and clips a label longer than the row', () => {
    const frame = drawDivider({ label: 'A label that is much longer than thirty columns' }, 30);

    expect(frame.width).toBe(30);
    expect(frame.rows[0]).toHaveLength(30);
  });

  it('draws the same rule in static mode, which shows the interactive frame without motion', () => {
    const staticFrame = drawnFrame(dividerBlock.render({ mode: 'static', slots: RELEASE_SLOTS, config: { width: 60 } }));

    expect(staticFrame.rows).toEqual(drawDivider(RELEASE_SLOTS).rows);
  });

  it('keeps pipe and accessible output as labelled slot lines', () => {
    const pipe = dividerBlock.render({ mode: 'pipe', slots: RELEASE_SLOTS });
    const accessible = dividerBlock.render({ mode: 'accessible', slots: RELEASE_SLOTS });

    expect(pipe.output).toBe('DividerBlock\nlabel: Release Evidence\nstyle: rule\ndensity: compact');
    expect(accessible.output).toBe('DividerBlock\nLabel: Release Evidence\nStyle: rule\nDensity: compact');
  });

  it('keeps the same facts in interactive mode as in pipe mode, apart from the mode fact', () => {
    const withoutMode = (facts: readonly { key: string }[] | undefined) =>
      (facts ?? []).filter((fact) => !fact.key.includes('mode'));
    const interactive = dividerBlock.render({ mode: 'interactive', slots: RELEASE_SLOTS });
    const pipe = dividerBlock.render({ mode: 'pipe', slots: RELEASE_SLOTS });

    expect(withoutMode(interactive.facts)).toEqual(withoutMode(pipe.facts));
  });

  it('fits every width from 30 to 120 for seeded random labels', () => {
    let seed = 935;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    let witnesses = 0;
    for (let width = 30; width <= 120; width += 1) {
      const label = 'x'.repeat(next() % 140);
      const frame = drawDivider({ label, density: next() % 2 === 0 ? 'compact' : 'spacious' }, width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => row.length === width)).toBe(true);
      witnesses += 1;
    }
    expect(witnesses).toBe(91);
  });
});

describe('framedSlotTitles shared check', () => {
  it('reports the slot labels that the generic section renderer frames', () => {
    const frame = drawnFrame(textEntryBlock.render({
      mode: 'interactive',
      slots: { field: 'Search docs', value: 'table', placeholder: 'type a query' },
    }));

    expect(framedSlotTitles(textEntryBlock, frame)).toEqual(['Field', 'Value', 'Placeholder']);
  });
});
