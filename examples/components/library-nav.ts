import { COMPONENT_STORIES } from '../docs/stories.js';
import { FAMILIES, liveVariant, type LibraryModel } from './library-model.js';

/**
 * Every slide in deck order: the title, each family's slide followed by its components, then the end slide.
 * Navigation and the progress bar both walk this one sequence.
 */
export const SEQUENCE: readonly string[] = [
  'title',
  ...FAMILIES.flatMap((family) => [
    `family:${family}`,
    ...COMPONENT_STORIES.flatMap((story, index) => (story.family === family ? [`component:${String(index)}`] : [])),
  ]),
  'end',
];

/** The model's place in SEQUENCE. */
export function position(model: LibraryModel): number {
  const family = COMPONENT_STORIES[model.index]?.family ?? '';
  const key = model.stage === 'title' || model.stage === 'end' ? model.stage
    : model.stage === 'intro' ? `family:${family}` : `component:${String(model.index)}`;
  return Math.max(0, SEQUENCE.indexOf(key));
}

/** The slide `delta` steps away, without wrapping: undefined at either end of the deck. */
export function stepTarget(model: LibraryModel, delta: number): string | undefined {
  return SEQUENCE[position(model) + delta];
}

/** The previous or next family slide, without wrapping; past the last family is the end slide, before the first is the title. */
export function familyTarget(model: LibraryModel, delta: number): string | undefined {
  const at = position(model);
  if (delta > 0) return SEQUENCE.slice(at + 1).find((key) => key.startsWith('family:') || key === 'end');
  // Back goes to the current family's slide first when you are past it, then to earlier families.
  return [...SEQUENCE.slice(0, at)].reverse().find((key) => key.startsWith('family:') || key === 'title');
}

/** The model showing a SEQUENCE slide. A family slide starts its entry transition at the current time. */
export function showSlide(model: LibraryModel, key: string): LibraryModel {
  const base = { ...model, scroll: 0, slide: undefined, introExitAt: undefined };
  if (key === 'title' || key === 'end') return { ...base, stage: key };
  if (key.startsWith('family:')) {
    const index = Math.max(0, COMPONENT_STORIES.findIndex((story) => story.family === key.slice('family:'.length)));
    return { ...base, index, variantIndex: liveVariant(index), stage: 'intro', introAt: model.time };
  }
  const index = Number(key.slice('component:'.length));
  return { ...base, index, variantIndex: liveVariant(index), stage: 'component' };
}
