import type {
  FrameAction,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { wrapFrameMsg } from './app-frame-types.js';
import type { Cmd } from './types.js';
import { animate } from './animate.js';
import { EASINGS } from './spring.js';

const FOOTER_TOGGLE_DURATION_MS = 200;
type FooterTransitionAction = Extract<
  FrameAction,
  { readonly type: 'footer-transition' }
>;
type FooterTransitionCompleteAction = Extract<
  FrameAction,
  { readonly type: 'footer-transition-complete' }
>;

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

export function applyFooterTransition<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: FooterTransitionAction,
): InternalFrameModel<PageModel, Msg> {
  if (!isCurrentFooterGeneration(model, action.generation)) return model;
  return {
    ...model,
    footerTranslateY: Math.max(0, Math.min(1, action.translateY)),
  };
}

export function applyFooterTransitionComplete<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: FooterTransitionCompleteAction,
): InternalFrameModel<PageModel, Msg> {
  if (!isCurrentFooterGeneration(model, action.generation)) return model;
  return {
    ...model,
    footerVisible: action.visible,
    footerTranslateY: action.visible ? 0 : 1,
  };
}

function isCurrentFooterGeneration<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  generation: number,
): boolean {
  return generation === (model.footerAnimationGeneration ?? 0);
}
