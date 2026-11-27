import type { BlockDefinition, BlockRenderResult } from './block-metadata.js';
import { isSurfaceOutput, surfaceText } from './standard-blocks.test-support.part01.js';

/** One drawn `interactive` frame of a block, as text rows. */
interface DrawnFrame {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}

function drawnFrame(result: BlockRenderResult): DrawnFrame {
  if (!isSurfaceOutput(result)) {
    throw new Error('interactive output is not a Surface');
  }
  const surface = result.output;
  const rows = surfaceText(surface).split('\n').slice(0, surface.height);
  return { width: surface.width, height: surface.height, rows };
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Slots of `block` whose label or id appears as a framed box title in `frame`,
 * when `frame` has the generic section rendering's shape.
 *
 * The generic section renderer draws an outer frame titled with the block's
 * name (`┌─ DividerBlock ───`) holding one box per slot, titled with the slot's
 * label, or its capitalised id when the slot has no metadata label (AppShell,
 * ReaderSurface, InspectorPanel). The match takes the label and the id,
 * ignoring case. A frame without that outer title is a drawn block, so its own
 * text, such as a rule labelled "Style", is never reported. An empty result is
 * the oracle for "this block draws itself".
 */
function framedSlotTitles(block: BlockDefinition, frame: DrawnFrame): readonly string[] {
  const outerTitle = new RegExp(`─ ${escapeForPattern(block.metadata.blockName)} ─`, 'u');
  if (!outerTitle.test(frame.rows[0] ?? '')) return [];
  return block.metadata.slots
    .filter((slot) => [slot.label, slot.id].some((name) => {
      if (name === undefined) return false;
      const title = new RegExp(`─ ${escapeForPattern(name)} ─`, 'iu');
      return frame.rows.some((row) => title.test(row));
    }))
    .map((slot) => slot.label ?? slot.id);
}

export type { DrawnFrame };
export { drawnFrame, framedSlotTitles };
