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

const TOP_ROW = /^[┌╭╔┏]─.*[┐╮╗┓]$/u;
const BOTTOM_ROW = /^[└╰╚┗]─*[┘╯╝┛]$/u;

/** True when `frame` is one box from corner to corner, titled with `blockName`. */
function hasGenericOuterFrame(blockName: string, frame: DrawnFrame): boolean {
  const top = frame.rows[0] ?? '';
  const bottom = frame.rows[frame.rows.length - 1] ?? '';
  return TOP_ROW.test(top)
    && top.includes(`─ ${blockName} ─`)
    && BOTTOM_ROW.test(bottom);
}

/**
 * Slots of `block` whose label or id appears as a framed box title in `frame`,
 * when `frame` has the generic section rendering's shape.
 *
 * The generic section renderer draws an outer frame titled with the block's
 * name (`┌─ DividerBlock ───`) holding one box per slot, titled with the slot's
 * label, or its capitalised id when the slot has no metadata label (AppShell,
 * ReaderSurface, InspectorPanel). The match takes the label and the id,
 * ignoring case. A frame without that outer frame (a top row from corner to
 * corner, titled with the block name, and a bottom row from corner to corner)
 * is a drawn block, so its own text, such as a rule labelled
 * "DividerBlock ─ Style", is never reported. An empty result is the oracle for
 * "this block draws itself".
 */
function framedSlotTitles(block: BlockDefinition, frame: DrawnFrame): readonly string[] {
  if (!hasGenericOuterFrame(block.metadata.blockName, frame)) return [];
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
