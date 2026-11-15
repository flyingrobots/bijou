import {
  createSurface,
  paginator,
  parseAnsiToSurface,
  progressBar,
  stepper,
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

/** A screen-wide progress bar through the whole deck, labelled "X of Y" at its end. */
export function progressRow(model: LibraryModel, width: number, ctx: BijouContext): Surface {
  const percent = SEQUENCE.length < 2 ? 100 : (position(model) / (SEQUENCE.length - 1)) * 100;
  const label = ` ${slideLabel(model)} `;
  const elevated = ctx.surface('elevated').bg ?? ctx.surface('elevated').hex;
  // The unfilled part and the label sit on the elevated surface, so the row reads as one band in every theme.
  const emptyToken = { hex: ctx.semantic('muted').hex, bg: elevated };
  const row = createSurface(width, 1);
  row.blit(toSurface(progressBar(percent, { width: Math.max(1, width - label.length), showPercent: false, emptyToken, ctx }), width), 0, 0);
  Array.from(label).forEach((char, i) => {
    row.set(width - label.length + i, 0, { char, fg: ctx.semantic('primary').hex, bg: elevated, empty: false });
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
 * Where a component sits within its family: Bijou's stepper(), or paginator() dots when the stepper
 * is wider than the screen. On a family slide `current` is the family's first component.
 */
export function familyStepper(family: string, current: number, width: number, ctx: BijouContext): Surface {
  const members = familyMembers(family);
  const at = Math.max(0, members.findIndex((m) => m.index === current));
  let text = stepper(members.map((m) => ({ label: m.name })), { current: at, ctx });
  if (Array.from(stripAnsi(text)).length > width) text = paginator({ current: at, total: members.length, ctx });
  return toSurface(text, width);
}
