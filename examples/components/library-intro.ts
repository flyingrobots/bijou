import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { applyTransition } from '../hero/transition.js';
import { FAMILIES, INTRO_IN, INTRO_OUT, type LibraryModel } from './library-model.js';
import { familySlide, FAMILY_TRANSITIONS } from './library-stages.js';

/**
 * A family intro in progress: the slide enters over `from` through the family's shader, holds
 * until the user continues, then leaves into the component through the next shader.
 */
export function introBody(
  model: LibraryModel, width: number, height: number, ctx: BijouContext,
  from: Surface | undefined, component: () => Surface,
): Surface {
  const family = COMPONENT_STORIES[model.index]?.family ?? '';
  const fi = FAMILIES.indexOf(family);
  const slide = familySlide(width, height, family, fi, FAMILIES.length, COMPONENT_STORIES.filter((s) => s.family === family), ctx, model.rtl);
  const into = FAMILY_TRANSITIONS.at(fi % FAMILY_TRANSITIONS.length) ?? FAMILY_TRANSITIONS[0];
  const outOf = FAMILY_TRANSITIONS.at((fi + 1) % FAMILY_TRANSITIONS.length) ?? FAMILY_TRANSITIONS[0];
  const t = model.time - model.introAt;
  const out = model.introExitAt === undefined ? -1 : (model.time - model.introExitAt) / INTRO_OUT;
  const frame = Math.round(model.time * 60);
  const start = from?.height === height ? from : createSurface(width, height);
  if (into === undefined || outOf === undefined) return slide;
  if (t < INTRO_IN) return applyTransition(start, slide, into.shader, t / INTRO_IN, frame, ctx);
  if (out < 0) return slide;
  return applyTransition(slide, component(), outOf.shader, Math.min(1, out), frame, ctx);
}
