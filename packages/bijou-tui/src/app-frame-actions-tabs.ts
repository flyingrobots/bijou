import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { Cmd } from './types.js';
import { EASINGS } from './spring.js';
import { timeline } from './timeline.js';
import { syncPageFrameState } from './app-frame-actions-pane.js';

export function switchTab<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const index = model.pageOrder.indexOf(model.activePageId);
  if (index < 0) return [model, []];
  const nextIndex =
    (index + delta + model.pageOrder.length) % model.pageOrder.length;
  const nextId = model.pageOrder[nextIndex];
  if (nextId === undefined || nextId === model.activePageId) return [model, []];
  const activePageModel = model.pageModels[model.activePageId];
  if (activePageModel === undefined) return [model, []];
  const activeTransition = options.transitionOverride
    ? options.transitionOverride(activePageModel)
    : options.transition;
  const hasTransition =
    activeTransition != null && activeTransition !== 'none';
  const nextGeneration = model.transitionGeneration + 1;
  const transitionTimeline = hasTransition
    ? (options.transitionTimeline ?? timeline()
      .add('progress', {
        type: 'tween',
        from: 0,
        to: 1,
        duration: options.transitionDuration ?? 300,
        ease: EASINGS.easeInOutCubic,
      })
      .build())
    : undefined;
  const durationMs =
    transitionTimeline?.estimatedDurationMs
    ?? options.transitionDuration
    ?? 300;
  const nextModel = syncPageFrameState({
    ...model,
    activePageId: nextId,
    previousPageId: model.activePageId,
    activeTransition,
    transitionProgress: hasTransition ? 0 : 1,
    transitionGeneration: nextGeneration,
    transitionFrame: 0,
    transitionStartMs: undefined,
    transitionTimeline,
    transitionTimelineState: transitionTimeline?.init(),
  }, nextId, pagesById);
  if (!hasTransition) return [nextModel, []];
  return [
    nextModel,
    [createTransitionTickCmd(durationMs, nextGeneration)],
  ];
}

export function createTransitionTickCmd<Msg>(
  durationMs: number,
  generation: number,
): Cmd<FramedAppMsg<Msg>> {
  return (emit, caps) =>
    new Promise<undefined>((resolve) => {
      if (durationMs <= 0) {
        emit(wrapFrameMsg({ type: 'transition-complete', generation }));
        resolve(undefined);
        return;
      }
      let elapsedMs = 0;
      const pulse = caps.onPulse((dt) => {
        elapsedMs = Math.min(durationMs, elapsedMs + Math.max(0, dt * 1000));
        const progress = Math.min(1, elapsedMs / durationMs);
        emit(wrapFrameMsg({
          type: 'transition',
          progress,
          generation,
          dt,
          elapsedMs,
        }));
        if (progress >= 1) {
          pulse.dispose();
          emit(wrapFrameMsg({ type: 'transition-complete', generation }));
          resolve(undefined);
        }
      });
    });
}
