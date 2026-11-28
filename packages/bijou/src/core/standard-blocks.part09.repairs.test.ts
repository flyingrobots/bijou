import { createTextSurface } from './components/surface-text.js';
import { parseAnsiToSurface } from './render/differ-ansi.js';
import {
  blockRenderNode, describe, expect, findCell, isSurfaceOutput, it, renderBlockTree,
} from './standard-blocks.test-support.js';
import { STATUS_CASES, comparableRows, drawStatus } from './standard-blocks-status.test-support.js';

/** The slot of each status block that the repair tests fill with a Surface or a throwing getter. */
const SURFACE_SLOT: Readonly<Record<string, string>> = {
  InlineStatusBlock: 'label',
  InFlowStatusBlock: 'message',
  TransientOverlayBlock: 'message',
  ActivityStreamBlock: 'events',
  ShortcutCueBlock: 'shortcuts',
  ProgressIndicatorBlock: 'label',
};

function words(value: unknown): readonly string[] {
  const texts = Array.isArray(value) ? value.map(String) : [String(value)];
  return texts.flatMap((text) => text.split(/\s+/u)).filter((word) => word !== '');
}

function joinedRows(rows: readonly string[]): string {
  return rows.join('\n');
}

function renderedSurface(block: (typeof STATUS_CASES)[number]['block'], slots: Readonly<Record<string, unknown>>) {
  const result = renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width: 30 } }));
  if (!isSurfaceOutput(result)) throw new Error('interactive output is not a Surface');
  return result.output;
}

describe.each(STATUS_CASES)('$block.metadata.blockName repairs (flyingrobots/bijou#936 review)', (spec) => {
  const slotId = SURFACE_SLOT[spec.block.metadata.blockName] ?? '';
  const required = spec.block.metadata.slots.filter((slot) => slot.required).map((slot) => slot.id);

  it('R2: keeps every word of every DOGFOOD slot at width 30', () => {
    const joined = joinedRows(comparableRows(drawStatus(spec.block, spec.slots, 30)));
    const lost = Object.values(spec.slots).flatMap(words).filter((word) => !joined.includes(word));

    expect(lost).toEqual([]);
  });

  it('R2: keeps every word of the missing-slot text at width 30', () => {
    for (const id of required) {
      const joined = joinedRows(comparableRows(drawStatus(spec.block, { ...spec.slots, [id]: undefined }, 30)));
      expect(words(`(missing required ${id})`).filter((word) => !joined.includes(word))).toEqual([]);
    }
  });

  it('R1: blits a Surface slot with its cells unchanged, clipped to the width', () => {
    const nested = createTextSurface('Qnested', { fg: '#ff8800', modifiers: ['bold'] });
    const output = renderedSurface(spec.block, { ...spec.slots, [slotId]: nested });

    expect(output.width).toBe(30);
    expect(findCell(output, 'Q')).toMatchObject({ char: 'Q', fg: nested.get(0, 0).fg, modifiers: ['bold'] });
  });

  it('R1: draws a Surface slot that holds wide graphemes without throwing', () => {
    const wide = parseAnsiToSurface('世界 ok', 7, 1);
    const frame = drawStatus(spec.block, { ...spec.slots, [slotId]: wide }, 30);

    expect(frame.width).toBe(30);
    expect(joinedRows(frame.rows)).toContain('世');
  });

  it('R3: reads slots through own data properties, so a throwing getter draws the missing-slot text', () => {
    const slots: Record<string, unknown> = { ...spec.slots };
    Object.defineProperty(slots, slotId, { enumerable: true, get: () => { throw new Error('getter read'); } });

    const frame = drawStatus(spec.block, slots, 30);
    expect(joinedRows(comparableRows(frame))).toContain('missing');
    expect(words(`(missing required ${slotId})`).filter((word) => !joinedRows(frame.rows).includes(word))).toEqual([]);
  });
});

describe('status drawing wrapping details (flyingrobots/bijou#936 review)', () => {
  const inline = STATUS_CASES[0];

  it('R2: hard-breaks a word longer than the row instead of cutting it', () => {
    if (inline === undefined) throw new Error('missing InlineStatusBlock case');
    const frame = drawStatus(inline.block, { ...inline.slots, label: 'x'.repeat(70) }, 30);

    expect(frame.rows.join('').split('x').length - 1).toBe(70);
    expect(frame.rows.every((row) => row.length === 30)).toBe(true);
  });

  it('R2: a status badge wider than the row keeps the label and every status word', () => {
    if (inline === undefined) throw new Error('missing InlineStatusBlock case');
    const status = 'waiting on a very long upstream review queue';
    const joined = joinedRows(drawStatus(inline.block, { ...inline.slots, status }, 30).rows);

    expect([...words(status), 'Docs', 'inventory'].filter((word) => !joined.includes(word))).toEqual([]);
  });
});
