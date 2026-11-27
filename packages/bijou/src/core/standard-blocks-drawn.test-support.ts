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
 * Slot labels of `block` that appear as a framed box title in `frame`.
 *
 * The generic section renderer draws one box per slot, titled with the slot's
 * label (`┌─ Label ───`). A drawn block shows none of those titles, so an empty
 * result is the oracle for "this block draws itself".
 */
function framedSlotTitles(block: BlockDefinition, frame: DrawnFrame): readonly string[] {
  const labels = block.metadata.slots.map((slot) => slot.label ?? slot.id);
  return labels.filter((label) => {
    const title = new RegExp(`─ ${escapeForPattern(label)} ─`, 'u');
    return frame.rows.some((row) => title.test(row));
  });
}

export type { DrawnFrame };
export { drawnFrame, framedSlotTitles };
