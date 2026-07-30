import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { FrameAction, InternalFrameModel } from './app-frame-types.js';
import { frameMessage } from './app-frame-i18n.js';
import { helpViewSurface, type BindingSource } from './help.js';
import { createPagerStateForSurface, pagerSurface } from './pager.js';

export function renderHelpOverlay<PageModel, Msg>(
  model: Pick<
    InternalFrameModel<PageModel, Msg>,
    'columns' | 'rows' | 'helpScrollY'
  >,
  source: BindingSource,
  i18n?: I18nRuntime,
): {
  body: ReturnType<typeof pagerSurface>;
  maxScrollY: number;
  scrollY: number;
} {
  const maxDialogWidth = Math.max(28, Math.min(model.columns - 4, 88));
  const bodyWidth = Math.max(20, maxDialogWidth - 4);
  const helpSurface = helpViewSurface(source, {
    title: undefined,
    width: bodyWidth,
    defaultGroupName: frameMessage(i18n, 'help.group.general', 'General'),
  });
  const pagerHeight = Math.max(
    4,
    Math.min(helpSurface.height + 1, Math.max(4, model.rows - 8)),
  );
  const pagerState = createPagerStateForSurface(helpSurface, {
    width: bodyWidth,
    height: pagerHeight,
  });
  const scrollY = Math.max(
    0,
    Math.min(model.helpScrollY, pagerState.scroll.maxY),
  );
  const scrolledState = {
    ...pagerState,
    scroll: { ...pagerState.scroll, y: scrollY },
  };
  return {
    body: pagerSurface(helpSurface, scrolledState, {
      showScrollbar: true,
      showStatus: true,
    }),
    maxScrollY: pagerState.scroll.maxY,
    scrollY,
  };
}

export function isHelpScrollAction(
  action: FrameAction,
): action is Extract<
  FrameAction,
  {
    type:
      | 'scroll-up'
      | 'scroll-down'
      | 'page-up'
      | 'page-down'
      | 'top'
      | 'bottom';
  }
> {
  return (
    action.type === 'scroll-up' ||
    action.type === 'scroll-down' ||
    action.type === 'page-up' ||
    action.type === 'page-down' ||
    action.type === 'top' ||
    action.type === 'bottom'
  );
}
