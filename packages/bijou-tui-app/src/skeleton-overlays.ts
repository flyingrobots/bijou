import {
  modal,
  type Overlay,
} from '@flyingrobots/bijou-tui';
import {
  renderFooterControlsRow,
  renderFooterStatusRow,
  renderHeaderRow,
  renderSeparatorRow,
  renderTabRow,
} from './skeleton-chrome.js';
import type { SkeletonOverlayOptions } from './skeleton-contract.js';
import { maybeRenderDrawerOverlay } from './skeleton-drawer.js';

/** Resolve the quit modal width without crossing the terminal's lower bound. */
export function resolveQuitModalWidth(width: number): number {
  return Math.max(0, Math.min(56, width - 2, Math.max(20, width - 4)));
}

/** Assemble the shell overlay stack in terminal z-order. */
export function buildSkeletonOverlays(
  options: SkeletonOverlayOptions,
): readonly Overlay[] {
  const width = Math.max(0, options.frame.screenRect.width);
  const height = Math.max(0, options.frame.screenRect.height);
  if (width <= 0 || height <= 0) return [];
  const tab =
    options.tabsById.get(options.frame.activePageId) ?? options.allTabs[0];
  if (tab == null) return [];
  const pageConfig =
    options.pageConfigs.get(tab.id) ?? { hasDrawer: false };
  const status = typeof options.statusMessage === 'function'
    ? options.statusMessage({
      activeTabId: tab.id,
      activeTabTitle: tab.title,
    })
    : (options.statusMessage ?? `${tab.title} ready`);
  const overlays: Overlay[] = [{
    row: 0,
    col: 0,
    content: renderTabRow(
      width,
      options.allTabs,
      tab.id,
      options.tokens,
      options.ctx,
    ),
  }];
  if (height >= 5) {
    overlays.push({
      row: 1,
      col: 0,
      content: renderHeaderRow(
        width,
        options.title,
        tab.title,
        options.tokens,
        options.ctx,
      ),
    });
  }
  const drawer = maybeRenderDrawerOverlay(
    options.frame,
    pageConfig,
    width,
    height,
    options.tokens,
    options.ctx,
  );
  if (drawer != null) overlays.push(drawer);
  appendFooter(overlays, options, width, height, status, tab.title);
  if (options.frame.pageModel.quitConfirmOpen) {
    overlays.push(modal({
      title: 'Quit App?',
      body: 'Exit this TUI session now?',
      hint: 'Y / Enter confirm  •  N / Esc cancel',
      width: resolveQuitModalWidth(width),
      screenWidth: width,
      screenHeight: height,
      borderToken:
        options.tokens?.modalBorderToken ?? options.ctx.theme.theme.border.warning,
      bgToken:
        options.tokens?.modalBgToken ?? options.ctx.theme.theme.surface.overlay,
      ctx: options.ctx,
    }));
  }
  return overlays;
}

function appendFooter(
  overlays: Overlay[],
  options: SkeletonOverlayOptions,
  width: number,
  height: number,
  status: string,
  tabTitle: string,
): void {
  if (height >= 3) {
    if (height >= 4) {
      overlays.push({
        row: height - 3,
        col: 0,
        content: renderSeparatorRow(width, options.tokens, options.ctx),
      });
    }
    overlays.push({
      row: height - 2,
      col: 0,
      content: renderFooterStatusRow(
        width,
        status,
        tabTitle,
        options.tokens,
        options.ctx,
      ),
    });
  }
  if (height >= 2) {
    overlays.push({
      row: height - 1,
      col: 0,
      content: renderFooterControlsRow(
        width,
        options.keyLegend,
        options.tokens,
        options.ctx,
      ),
    });
  }
}
