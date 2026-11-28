import type { BijouContext } from '../../ports/context.js';
import type { Surface } from '../../ports/surface.js';
import { kbd } from '../components/kbd.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { isPlainRecord } from './schema-utils.js';
import type { StandardDrawInput } from './draw-input.js';
import { clipSurface, flow, sectionAtoms, styledAtoms, textAtoms, type FlowAtom } from './draw-status-flow.js';
import { findSection, hasSlot, visualContext } from './draw-status-shared.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

const SCOPE_SEPARATOR = '│';

interface Cue {
  readonly key: string;
  readonly action: string;
}

function ownText(record: Record<string, unknown>, key: string): string | undefined {
  const value: unknown = Object.getOwnPropertyDescriptor(record, key)?.value;
  return typeof value === 'string' ? value : undefined;
}

/** A `{ key, action }` record, or text whose first word is the key (`Esc Close`). */
function parseCue(item: unknown, text: string): Cue {
  if (isPlainRecord(item)) {
    const key = ownText(item, 'key');
    if (key !== undefined) return { key, action: ownText(item, 'action') ?? ownText(item, 'label') ?? '' };
  }
  const trimmed = text.trim();
  const gap = trimmed.search(/\s/u);
  return gap < 0 ? { key: trimmed, action: '' } : { key: trimmed.slice(0, gap), action: trimmed.slice(gap).trim() };
}

/** One cue: the key cap (`kbd`) and its action words. A Surface cue is blitted, clipped to the width. */
function cueAtoms(item: unknown, ctx: BijouContext | undefined, width: number): readonly Surface[] {
  if (isSurfaceSlotValue(item)) return [clipSurface(item, width)];
  const text = slotValueText(item);
  if (text === undefined || text.trim() === '') return [];
  const cue = parseCue(item, text);
  const key = sanitizePlainTerminalText(cue.key);
  const cap = ctx === undefined ? `[ ${key} ]` : kbd(key, { ctx });
  return [...styledAtoms(cap, width), ...textAtoms(cue.action, width)];
}

/**
 * Draws `ShortcutCueBlock` as a row of key cues (`kbd`) with their actions,
 * after the scope. Cues that do not fit continue on the next row.
 */
function drawShortcutCue(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const ctx = visualContext();
  const raw = ownSlotValue(input.slots, 'shortcuts');
  const items: readonly unknown[] = Array.isArray(raw) ? raw : [raw];
  const cues = items.map((item) => cueAtoms(item, ctx, width)).filter((cue) => cue.length > 0);
  const body: readonly FlowAtom[] = cues.length > 0
    ? cues.flatMap((cue, index): FlowAtom[] => (index === 0 ? [...cue] : ['gap', ...cue]))
    : sectionAtoms(findSection(input.sections, 'shortcuts'), width);
  const scope = findSection(input.sections, 'scope');
  const prefix = hasSlot(scope) ? [...sectionAtoms(scope, width), ...textAtoms(SCOPE_SEPARATOR, width)] : [];
  return flow([...prefix, ...body], width);
}

export { drawShortcutCue };
