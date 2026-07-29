import type { FramePage, CreateFramedAppOptions } from './app-frame.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { Cmd } from './types.js';
import { animate } from './animate.js';
import { EASINGS } from './spring.js';

const FOOTER_TOGGLE_DURATION_MS = 200;

export function toggleFooter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] {
  const currentVisible = model.footerVisible ?? true;
  const visible = !currentVisible;
  const generation = (model.footerAnimationGeneration ?? 0) + 1;
  const defaultTranslateY = currentVisible ? 0 : 1;
  const from = Math.max(
    0,
    Math.min(1, model.footerTranslateY ?? defaultTranslateY),
  );
  const to = visible ? 0 : 1;
  const ease = visible ? EASINGS.easeIn : EASINGS.easeOut;
  return [{
    ...model,
    footerVisible: visible,
    footerAnimationGeneration: generation,
  }, [
    animate<FramedAppMsg<Msg>>({
      type: 'tween',
      from,
      to,
      duration: FOOTER_TOGGLE_DURATION_MS,
      ease,
      onFrame: (translateY) => wrapFrameMsg({
        type: 'footer-transition',
        translateY,
        generation,
      }),
      onComplete: () => wrapFrameMsg({
        type: 'footer-transition-complete',
        visible,
        generation,
      }),
    }),
  ]];
}

export function hasNotificationCenter<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): boolean {
  const activePage = pagesById.get(model.activePageId);
  if (activePage == null) return options.runtimeNotifications !== false;
  const pageModel = model.pageModels[model.activePageId];
  if (pageModel === undefined) return options.runtimeNotifications !== false;
  const provided = options.notificationCenter?.({
    model,
    activePage,
    pageModel,
    runtimeNotifications: model.runtimeNotifications,
  });
  return provided != null || options.runtimeNotifications !== false;
}
