import type { BijouContext } from '@flyingrobots/bijou';
import { createFramedApp, createKeyMap, drawer, EASINGS, modal, timeline, type App, type FrameModel, type Overlay } from '@flyingrobots/bijou-tui';
import type { ShowcaseMsg, ShowcasePageModel } from './types.js';
import { CATEGORIES } from './registry.js';
import { createCategoryPage } from './app-category.js';
import { renderDrawerContent } from './app-views.js';
import { clamp01, resolveQuitModalWidth } from './app-utils.js';

export function createShowcaseApp(
  ctx: BijouContext,
): App<FrameModel<ShowcasePageModel>, ShowcaseMsg> {
  const pages = CATEGORIES.map((cat, idx) => createCategoryPage(cat, idx === 0, ctx));

  return createFramedApp<ShowcasePageModel, ShowcaseMsg>({
    title: 'Bijou Component Showcase',
    pages,
    defaultPageId: 'display',
    enableCommandPalette: true,
    transition: 'dissolve',
    transitionTimeline: timeline()
      .add('progress', {
        type: 'tween',
        from: 0,
        to: 1,
        duration: 400,
        ease: EASINGS.easeInOutCubic,
      })
      .build(),
    globalKeys: createKeyMap<ShowcaseMsg>()
      .group('App', (g) => g
        .bind('q', 'Quit (confirm)', { type: 'request-quit' })
        .bind('ctrl+c', 'Force quit', { type: 'force-quit' })
        .bind('escape', 'Cancel / Close', { type: 'cancel-quit' })
        .bind('enter', 'Confirm quit', { type: 'confirm-quit' })
        .bind('o', 'Toggle welcome drawer', { type: 'toggle-drawer' }),
      ),
    overlayFactory(frame) {
      const overlays: Overlay[] = [];

      // Welcome drawer (animated, left side)
      const progress = clamp01(frame.pageModel.drawerProgress);
      if (progress > 0.01) {
        const idealWidth = Math.max(28, Math.floor(frame.screenRect.width * 0.3));
        const animatedWidth = Math.max(6, Math.round(idealWidth * progress));

        overlays.push(drawer({
          anchor: 'left',
          title: 'Welcome',
          content: renderDrawerContent(ctx),
          width: animatedWidth,
          screenWidth: frame.screenRect.width,
          screenHeight: frame.screenRect.height,
          borderToken: ctx.border('primary'),
          bgToken: ctx.surface('elevated'),
          ctx,
        }));
      }

      // Quit confirmation modal
      if (frame.pageModel.quitConfirmOpen) {
        overlays.push(modal({
          title: 'Quit Showcase?',
          body: 'Exit the component showcase?\n\nEnter = Yes\nEsc = No',
          hint: 'q request  |  enter confirm  |  esc cancel',
          width: resolveQuitModalWidth(frame.screenRect.width),
          screenWidth: frame.screenRect.width,
          screenHeight: frame.screenRect.height,
          borderToken: ctx.border('primary'),
          bgToken: ctx.surface('elevated'),
          ctx,
        }));
      }

      return overlays;
    },
  });
}
