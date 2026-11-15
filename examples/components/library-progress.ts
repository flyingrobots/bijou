import {
  paginator,
  parseAnsiToSurface,
  progressBar,
  stepper,
  stripAnsi,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { FAMILIES, type LibraryModel } from './library-model.js';

/** Every screen in show order: the title, then each family's slide followed by its components. */
const SEQUENCE: readonly string[] = [
  'title',
  ...FAMILIES.flatMap((family) => [
    `family:${family}`,
    ...COMPONENT_STORIES.flatMap((story, index) => (story.family === family ? [`component:${String(index)}`] : [])),
  ]),
];

function position(model: LibraryModel): number {
  const family = COMPONENT_STORIES[model.index]?.family ?? '';
  const key = model.stage === 'title' ? 'title' : model.stage === 'intro' ? `family:${family}` : `component:${String(model.index)}`;
  return Math.max(0, SEQUENCE.indexOf(key));
}

const toSurface = (text: string, width: number): Surface =>
  parseAnsiToSurface(text, Math.min(width, Array.from(stripAnsi(text)).length), 1);

/** A screen-wide progress bar: how far through the whole show (title, family slides, components) you are. */
export function progressRow(model: LibraryModel, width: number, ctx: BijouContext): Surface {
  const percent = SEQUENCE.length < 2 ? 100 : (position(model) / (SEQUENCE.length - 1)) * 100;
  // The unfilled part sits on the elevated surface, so the bar reads as one band in every theme.
  const emptyToken = { hex: ctx.semantic('muted').hex, bg: ctx.surface('elevated').bg ?? ctx.surface('elevated').hex };
  return toSurface(progressBar(percent, { width, showPercent: false, emptyToken, ctx }), width);
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
