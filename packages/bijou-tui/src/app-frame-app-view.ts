import type { Surface } from '@flyingrobots/bijou';
import { compositeSurfaceInto } from './overlay.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { FrameViewDependencies } from './app-frame-view-contract.js';
import { renderFrameBase } from './app-frame-view-base.js';
import { collectFrameOverlays } from './app-frame-view-overlays.js';

export type {
  FrameViewDependencies,
  FrameViewScratch,
} from './app-frame-view-contract.js';

export function renderFrameApp<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameViewDependencies<PageModel, Msg>,
): Surface {
  const base = renderFrameBase(model, dependencies);
  const overlays = collectFrameOverlays(model, dependencies, base);
  if (
    base.bodySurface != null &&
    base.bodyRect.width > 0 &&
    base.bodyRect.height > 0
  ) {
    base.frameSurface.blit(
      base.bodySurface,
      base.bodyRect.col,
      base.bodyRect.row,
    );
  }
  return compositeSurfaceInto(
    base.frameSurface,
    base.frameSurface,
    overlays,
    { dim: overlays.length > 0 },
  );
}
