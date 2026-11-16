import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { applyTransition } from '../hero/transition.js';
import { FAMILIES, INTRO_IN, INTRO_OUT, type LibraryModel } from './library-model.js';
import { familySlide, FAMILY_TRANSITION } from './library-stages.js';

/**
 * A family intro in progress: the slide enters over `from` with a dissolve, holds until the user
 * continues, then dissolves into the component.
 */
export function introBody(
  model: LibraryModel, width: number, height: number, ctx: BijouContext,
  from: Surface | undefined, component: () => Surface,
): Surface {
  const family = COMPONENT_STORIES[model.index]?.family ?? '';
  const fi = FAMILIES.indexOf(family);
  const slide = familySlide(width, height, family, fi, FAMILIES.length, COMPONENT_STORIES.filter((s) => s.family === family), ctx, model.rtl);
  const t = model.time - model.introAt;
  const out = model.introExitAt === undefined ? -1 : (model.time - model.introExitAt) / INTRO_OUT;
  const frame = Math.round(model.time * 60);
  const start = from?.height === height ? from : createSurface(width, height);
  if (t < INTRO_IN) return applyTransition(start, slide, FAMILY_TRANSITION, t / INTRO_IN, frame, ctx);
  if (out < 0) return slide;
  return applyTransition(slide, component(), FAMILY_TRANSITION, Math.min(1, out), frame, ctx);
}
