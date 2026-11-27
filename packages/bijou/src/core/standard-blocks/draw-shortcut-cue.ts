import type { BijouContext } from '../../ports/context.js';
import type { Surface } from '../../ports/surface.js';
import { kbd } from '../components/kbd.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { isPlainRecord } from './schema-utils.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { componentRow, hasText, visualContext } from './draw-status-shared.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

const CUE_GAP = '  ';
const SCOPE_SEPARATOR = ' │ ';

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

function drawCue(cue: Cue, ctx: BijouContext | undefined): string {
  const key = sanitizePlainTerminalText(cue.key);
  const cap = ctx === undefined ? `[ ${key} ]` : kbd(key, { ctx });
  const action = sanitizePlainTerminalText(cue.action);
  return action === '' ? cap : `${cap} ${action}`;
}

/** Draws `ShortcutCueBlock` as one row of key cues (`kbd`) with their actions, after the scope. */
function drawShortcutCue(input: StandardDrawInput): Surface {
  const ctx = visualContext();
  const raw = ownSlotValue(input.slots, 'shortcuts');
  const items: readonly unknown[] = Array.isArray(raw) ? raw : [raw];
  const cues = items.flatMap((item) => {
    const text = slotValueText(item);
    return text === undefined || text.trim() === '' ? [] : [drawCue(parseCue(item, text), ctx)];
  });
  const body = cues.length > 0
    ? cues.join(CUE_GAP)
    : sanitizePlainTerminalText(sectionContent(input.sections, 'shortcuts') ?? '');
  const scope = sectionContent(input.sections, 'scope');
  const prefix = hasText(scope) ? `${sanitizePlainTerminalText(scope)}${SCOPE_SEPARATOR}` : '';
  return componentRow(`${prefix}${body}`, input.bounds.width);
}

export { drawShortcutCue };
