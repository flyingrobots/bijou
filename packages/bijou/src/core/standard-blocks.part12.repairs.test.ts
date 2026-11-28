import { describe, expect, it } from 'vitest';

import { createSurface, type Cell, type Surface } from '../ports/surface.js';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import { createTextSurface } from './components/surface-text.js';
import { isSurfaceSlotValue } from './standard-blocks/render.part02.js';
import { DOCUMENT_BLOCK_CASES, drawBlock } from './standard-blocks-document.test-support.js';
import type { BlockDefinition } from './block-metadata.js';

/** Text slots that each block draws from a plain value; list slots take Surfaces as items. */
const SURFACE_SLOTS: Readonly<Record<string, readonly string[]>> = {
  FormattedDocumentBlock: ['heading', 'body', 'callout', 'code'],
  ExplainabilityWalkthroughBlock: ['title', 'steps', 'evidence', 'decision', 'nextStep'],
  FramedGroupBlock: ['title', 'items', 'mode'],
  BrandEmphasisBlock: ['brand', 'tagline'],
};
const LIST_SLOTS: readonly string[] = ['steps', 'items'];
/**
 * Slots left out of the every-word check: token slots pick how the block draws (or only feed facts) and are not
 * shown as text, and code is clipped at the row edge on purpose, because wrapping would change the code.
 */
const NOT_PROSE_SLOTS: readonly string[] = ['selected', 'decoration', 'role', 'code'];

function styledSurface(): Surface {
  return createTextSurface('nested', { fg: '#ff0000', modifiers: ['bold'] });
}

function wideSurface(): Surface {
  const surface = createSurface(3, 1);
  surface.set(0, 0, { char: '界', fg: '#00ff00' });
  return surface;
}

function drawSurface(block: BlockDefinition, slots: Readonly<Record<string, unknown>>, width = 60): Surface {
  const result = renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width } }));
  if (!isSurfaceSlotValue(result.output)) throw new Error('interactive output is not a Surface');
  return result.output;
}

function hasColour(cell: Cell, fg: string): boolean {
  return typeof cell.fg === 'string' && cell.fg.toLowerCase() === fg;
}

/** The characters of every cell drawn in `fg`, in reading order. */
function charsInColour(surface: Surface, fg: string): string {
  let chars = '';
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const cell = surface.get(x, y);
      if (hasColour(cell, fg)) chars += cell.char;
    }
  }
  return chars;
}

function words(value: unknown): readonly string[] {
  const text = Array.isArray(value) ? value.join(' ') : String(value);
  return text.split(/\s+/u).filter((word) => word !== '');
}

describe.each(DOCUMENT_BLOCK_CASES)('$name drawing repairs (flyingrobots/bijou#939 review)', (entry) => {
  const surfaceSlots = SURFACE_SLOTS[entry.name] ?? [];

  it.each(surfaceSlots)('blits a Surface-valued %s slot with its cell styling kept', (id) => {
    const nested = styledSurface();
    const value = LIST_SLOTS.includes(id) ? [nested, 'plain item'] : nested;
    const surface = drawSurface(entry.block, { ...entry.slots, [id]: value });

    expect(charsInColour(surface, '#ff0000')).toBe('nested');
    const source = nested.get(0, 0);
    const found = Array.from({ length: surface.height }, (_, y) => y)
      .flatMap((y) => Array.from({ length: surface.width }, (_, x) => surface.get(x, y)))
      .find((cell) => cell.char === 'n' && hasColour(cell, '#ff0000'));
    expect(found?.modifiers).toEqual(source.modifiers);
  });

  it.each(surfaceSlots)('blits a Surface-valued %s slot holding a wide grapheme without throwing', (id) => {
    const value = LIST_SLOTS.includes(id) ? [wideSurface()] : wideSurface();
    const surface = drawSurface(entry.block, { ...entry.slots, [id]: value }, 30);

    expect(surface.width).toBe(30);
    expect(charsInColour(surface, '#00ff00')).toContain('界');
  });

  it('shows every word of every text slot at width 30, wrapped rather than clipped', () => {
    const joined = drawBlock(entry.block, entry.slots, 30).rows.join(' ');
    const shown = Object.entries(entry.slots).filter(([id]) => !NOT_PROSE_SLOTS.includes(id));
    for (const [id, value] of shown) {
      for (const word of words(value)) {
        expect(joined, `${id}: ${word}`).toContain(word);
      }
    }
  });

  it('shows every word of each missing-slot text at width 30', () => {
    const required = entry.block.metadata.slots.filter((slot) => slot.required).map((slot) => slot.id);
    for (const id of required) {
      const rest = Object.fromEntries(Object.entries(entry.slots).filter(([key]) => key !== id));
      const joined = drawBlock(entry.block, rest, 30).rows.join(' ');
      for (const word of ['(missing', 'required', `${id})`]) {
        expect(joined, `${id}: ${word}`).toContain(word);
      }
    }
  });

  it('wraps a long slot value at width 30 instead of cutting it at the row edge', () => {
    const first = Object.keys(entry.slots)[0] ?? 'title';
    const long = 'Release evidence for the eight-oh train is gathered here';
    const joined = drawBlock(entry.block, { ...entry.slots, [first]: long }, 30).rows.join(' ');
    for (const word of words(long)) expect(joined).toContain(word);
  });

  it('draws the missing-slot text when a required slot is a throwing getter', () => {
    const slots: Record<string, unknown> = { ...entry.slots };
    Object.defineProperty(slots, entry.required, {
      enumerable: true,
      get: () => {
        throw new Error('slot getter must not be read');
      },
    });
    const frame = drawBlock(entry.block, slots);
    expect(frame.rows.join(' ')).toContain(`(missing required ${entry.required})`);
  });
});
