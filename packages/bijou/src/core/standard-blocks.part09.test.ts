import { afterEach } from 'vitest';
import { setDefaultContext, _resetDefaultContextForTesting } from '../context.js';
import { createTestContext } from '../adapters/test/index.js';
import { describe, expect, inFlowStatusBlock, it, progressIndicatorBlock, shortcutCueBlock } from './standard-blocks.test-support.js';
import { framedSlotTitles } from './standard-blocks-drawn.test-support.js';
import {
  STATUS_CASES, columns, comparableRows, drawStatus, fuzzSlots, lcg, omit,
} from './standard-blocks-status.test-support.js';

const PROGRESS = { label: 'Install packages', value: '3', total: '5', percent: '60%' };

describe.each(STATUS_CASES)('$block.metadata.blockName interactive drawing (flyingrobots/bijou#936)', (spec) => {
  const name = spec.block.metadata.blockName;
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('draws the DOGFOOD example slots at width 60', () => {
    const frame = drawStatus(spec.block, spec.slots);

    expect(frame.width).toBe(60);
    expect(comparableRows(frame)).toEqual(spec.golden);
  });

  it('shows no framed box titled with one of its slot labels', () => {
    expect(framedSlotTitles(spec.block, drawStatus(spec.block, spec.slots))).toEqual([]);
  });

  it('fits widths 30 and 120 exactly', () => {
    for (const width of [30, 120]) {
      const frame = drawStatus(spec.block, spec.slots, width);
      expect(frame.width).toBe(width);
      expect(frame.rows.map(columns)).toEqual(frame.rows.map(() => width));
      expect(framedSlotTitles(spec.block, frame)).toEqual([]);
    }
  });

  it('leaves every optional slot out of the drawing when it is absent', () => {
    const frame = drawStatus(spec.block, omit(spec.slots, spec.optional));

    expect(comparableRows(frame)).toEqual(spec.bare);
    expect(framedSlotTitles(spec.block, frame)).toEqual([]);
  });

  it('shows the missing-slot text inside the drawing when a required slot is absent', () => {
    const required = spec.block.metadata.slots.filter((slot) => slot.required).map((slot) => slot.id);
    for (const id of required) {
      const frame = drawStatus(spec.block, omit(spec.slots, [id]));
      expect(frame.rows.some((row) => row.includes(`(missing required ${id})`))).toBe(true);
      expect(framedSlotTitles(spec.block, frame)).toEqual([]);
    }
  });

  it('draws the same text in static mode and under a default interactive context', () => {
    const plain = drawStatus(spec.block, spec.slots).rows;
    expect(drawStatus(spec.block, spec.slots, 60, 'static').rows).toEqual(plain);
    setDefaultContext(createTestContext());
    expect(drawStatus(spec.block, spec.slots).rows).toEqual(plain);
  });

  it('keeps pipe and accessible output as labelled slot lines', () => {
    const lines = (key: (id: string) => string) => [name, ...Object.entries(spec.slots)
      .map(([id, value]) => `${key(id)}: ${Array.isArray(value) ? value.join('; ') : String(value)}`)].join('\n');
    const labels = new Map(spec.block.metadata.slots.map((slot) => [slot.id, slot.label ?? slot.id]));

    expect(spec.block.render({ mode: 'pipe', slots: spec.slots }).output).toBe(lines((id) => id));
    expect(spec.block.render({ mode: 'accessible', slots: spec.slots }).output)
      .toBe(lines((id) => labels.get(id) ?? id));
  });

  it('keeps the same facts in interactive mode as in pipe mode, apart from the mode fact', () => {
    const withoutMode = (facts: readonly { key: string }[] | undefined) =>
      (facts ?? []).filter((fact) => !fact.key.includes('mode'));
    const interactive = spec.block.render({ mode: 'interactive', slots: spec.slots });
    const pipe = spec.block.render({ mode: 'pipe', slots: spec.slots });

    expect(withoutMode(interactive.facts)).toEqual(withoutMode(pipe.facts));
  });

  it('fits every width from 30 to 120 for seeded random slots', () => {
    const next = lcg(936 + name.length);
    let witnesses = 0;
    for (let width = 30; width <= 120; width += 1) {
      const frame = drawStatus(spec.block, fuzzSlots(spec.block, next), width);
      expect(frame.width).toBe(width);
      expect(frame.rows.every((row) => columns(row) === width && !row.includes('\u001b'))).toBe(true);
      witnesses += 1;
    }
    expect(witnesses).toBe(91);
  });
});

describe('status drawing details (flyingrobots/bijou#936)', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('uses the InFlowStatus alert variant that matches severity', () => {
    const icons = { info: 'ℹ', warning: '⚠', error: '✗', success: '✓', unknown: 'ℹ' };
    for (const [severity, icon] of Object.entries(icons)) {
      const frame = drawStatus(inFlowStatusBlock, { severity, message: 'Disk check' });
      expect(comparableRows(frame)[1]?.startsWith(`│${icon} Disk check`)).toBe(true);
    }
  });

  it('draws a progress bar whose filled length matches percent', () => {
    for (const [percent, width] of [[0, 60], [1, 60], [25, 30], [50, 75], [99, 60], [100, 120], [150, 60], [-10, 60]] as const) {
      const bar = drawStatus(progressIndicatorBlock, { ...PROGRESS, percent }, width).rows[1] ?? '';
      const expected = Math.round((Math.max(0, Math.min(100, percent)) / 100) * (width - 5));
      expect(bar.split('█').length - 1).toBe(expected);
    }
  });

  it('reads the percent from text such as 42.5% and draws an empty bar for text that is not a number', () => {
    expect(drawStatus(progressIndicatorBlock, { ...PROGRESS, percent: '42.5%' }).rows[1]).toMatch(/^ 43% █{23}⠐{32}$/u);
    expect(drawStatus(progressIndicatorBlock, { ...PROGRESS, percent: 'soon' }).rows[1]).toMatch(/^ {2}0% ⠐{55}$/u);
  });

  it('still draws the progress bar and key cues when the default context is in pipe mode', () => {
    setDefaultContext(createTestContext({ mode: 'pipe' }));

    expect(drawStatus(progressIndicatorBlock, PROGRESS).rows[1]).toBe(` 60% ${'█'.repeat(33)}${'⠐'.repeat(22)}`);
    expect(drawStatus(shortcutCueBlock, { shortcuts: ['Esc Close'] }).rows[0]).toBe('[ Esc ] Close'.padEnd(60));
  });

  it('mirrors the progress bar under a right-to-left context', () => {
    setDefaultContext(createTestContext({ direction: 'rtl' }));
    const row = drawStatus(progressIndicatorBlock, PROGRESS).rows[1] ?? '';

    expect(row).toMatch(/^⠐{22}█{33} 60% $/u);
  });
});
