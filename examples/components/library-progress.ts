import {
  createSurface,
  paginator,
  parseAnsiToSurface,
  tabs,
  stripAnsi,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import type { LibraryModel } from './library-model.js';
import { position, SEQUENCE } from './library-nav.js';

const toSurface = (text: string, width: number): Surface =>
  parseAnsiToSurface(text, Math.min(width, Array.from(stripAnsi(text)).length), 1);

/** "X of Y" across the whole deck: the title, every family slide, and every component. It never resets. */
export function slideLabel(model: LibraryModel): string {
  return `${String(position(model) + 1)} of ${String(SEQUENCE.length)}`;
}

/**
 * The deck's position: a full-width bar the Library draws itself (decoration, not a task's progress, so not
 * progressBar()), ending in an "X of Y" label.
 */
export function progressRow(model: LibraryModel, width: number, ctx: BijouContext): Surface {
  const label = ` ${slideLabel(model)} `;
  const track = Math.max(1, width - label.length);
  const filled = SEQUENCE.length < 2 ? track : Math.round((position(model) / (SEQUENCE.length - 1)) * track);
  const elevated = ctx.surface('elevated').bg ?? ctx.surface('elevated').hex;
  const accent = ctx.semantic('accent').hex;
  const row = createSurface(width, 1);
  for (let x = 0; x < track; x++) row.set(x, 0, { char: ' ', bg: x < filled ? accent : elevated, empty: false });
  Array.from(label).forEach((char, i) => {
    row.set(track + i, 0, { char, fg: ctx.semantic('primary').hex, bg: elevated, empty: false });
  });
  return row;
}

/** The family's components in order, as each story's first function name. */
export function familyMembers(family: string): { index: number; name: string }[] {
  return COMPONENT_STORIES.flatMap((story, index) => (story.family === family
    ? [{ index, name: story.title.split('/')[0]?.trim().replace(/\(\)$/, '') ?? story.id }]
    : []));
}

/**
 * Peers with one active, as Bijou's tabs(); paginator() dots when the tabs are wider than `width`.
 * tabs() has no direction option yet, so right-to-left layout reverses the order here.
 */
export function peerTabs(labels: readonly string[], active: number, width: number, ctx: BijouContext, rtl = false): Surface {
  const order = rtl ? [...labels].reverse() : labels;
  let text = tabs(order.map((label) => ({ label })), { active: rtl ? labels.length - 1 - active : active, ctx });
  if (Array.from(stripAnsi(text)).length > width) text = paginator({ current: active, total: labels.length, ctx });
  return toSurface(text, width);
}

/** The family's components as tabs, with the current one active; on a family slide, the first. */
export function familyTabs(family: string, current: number, width: number, ctx: BijouContext, rtl = false): Surface {
  const members = familyMembers(family);
  return peerTabs(members.map((m) => m.name), Math.max(0, members.findIndex((m) => m.index === current)), width, ctx, rtl);
}
