import type { BijouContext } from '@flyingrobots/bijou';
import {
  drawer,
  type FrameOverlayContext,
  type Overlay,
} from '@flyingrobots/bijou-tui';
import type {
  SkeletonPageConfig,
  SkeletonPageModel,
  SkeletonThemeTokens,
} from './skeleton-contract.js';
import { clamp01 } from './skeleton-page.js';

/** Render the animated drawer when the active page owns one. */
export function maybeRenderDrawerOverlay(
  frame: FrameOverlayContext<SkeletonPageModel>,
  pageConfig: SkeletonPageConfig,
  width: number,
  height: number,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): Overlay | null {
  if (!pageConfig.hasDrawer) return null;
  const progress = clamp01(frame.pageModel.drawerProgress);
  if (progress <= 0.01) return null;
  const region = pageConfig.drawerPaneId == null
    ? frame.screenRect
    : (frame.paneRects.get(pageConfig.drawerPaneId) ?? frame.screenRect);
  if (region.width <= 0 || region.height <= 0) return null;
  const openWidth = clampInt(
    Math.max(22, Math.floor(region.width * 0.38)),
    0,
    region.width,
  );
  const animatedWidth = clampInt(
    Math.round(openWidth * progress),
    0,
    region.width,
  );
  if (animatedWidth < 6) return null;
  return drawer({
    anchor: 'right',
    title: 'Drawer',
    content: drawerContent(frame.pageModel),
    width: animatedWidth,
    screenWidth: width,
    screenHeight: height,
    region,
    borderToken:
      tokens?.drawerBorderToken ?? ctx.theme.theme.border.primary,
    bgToken: tokens?.drawerBgToken ?? ctx.theme.theme.surface.overlay,
    ctx,
  });
}

function drawerContent(model: SkeletonPageModel): string {
  return [
    'Supplemental drawer',
    '',
    'Use for side work.',
    'Keep the main pane active.',
    '',
    `Open: ${model.drawerOpen ? 'yes' : 'no'}`,
    `Width: ${String(Math.round(clamp01(model.drawerProgress) * 100))}%`,
    '',
    'o        toggle drawer',
    '[ / ]    switch pages',
    'q        quit (confirm)',
  ].join('\n');
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}
