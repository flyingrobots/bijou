import {
  createFramedApp,
  createKeyMap,
  type FramePage,
  type FramePageMsg,
  type FramedApp,
} from '@flyingrobots/bijou-tui';
import type {
  CreateTuiAppSkeletonOptions,
  SkeletonMsg,
  SkeletonPageModel,
  SkeletonTab,
} from './skeleton-contract.js';
import { mergeKeyMaps } from './skeleton-keys.js';
import { layoutFor } from './skeleton-layout.js';
import { buildSkeletonOverlays } from './skeleton-overlays.js';
import {
  buildPageSpecs,
  createInitialPageModel,
  pageConfigFor,
  updateSkeletonPage,
} from './skeleton-page.js';

const DEFAULT_TABS: readonly SkeletonTab[] = [
  { id: 'home', title: 'Home' },
  { id: 'split', title: 'Split' },
];
const DEFAULT_KEY_LEGEND =
  '[ ] pages | o drawer | tab panes | ctrl+p commands | q quit';

/**
 * Create an opinionated full-screen framed application shell.
 *
 * The shell provides a tab bar, header, animated supplemental drawer, framed
 * navigation, quit confirmation, two-line footer, and default drawer/split
 * pages. Use it for multi-view applications that need persistent chrome.
 * Prefer a smaller flow for one-shot prompts or document-style screens.
 */
export function createTuiAppSkeleton(
  options: CreateTuiAppSkeletonOptions,
): FramedApp<SkeletonPageModel, SkeletonMsg> {
  const tabs = options.tabs ?? DEFAULT_TABS;
  const first = tabs[0];
  if (first === undefined) {
    throw new Error('createTuiAppSkeleton: "tabs" must contain at least one tab');
  }
  const seenTabIds = new Set<string>();
  for (const tab of tabs) {
    if (seenTabIds.has(tab.id)) {
      throw new Error(`createTuiAppSkeleton: duplicate tab id "${tab.id}"`);
    }
    if (tab.render != null && tab.layout != null) {
      throw new Error(
        `createTuiAppSkeleton: tab "${tab.id}" cannot define both render and layout`,
      );
    }
    seenTabIds.add(tab.id);
  }

  const tabsById = new Map(tabs.map((tab) => [tab.id, tab] as const));
  const pageSpecs = buildPageSpecs(tabs);
  const pageConfigs = new Map(
    pageSpecs.map((spec) => [spec.tab.id, pageConfigFor(spec)] as const),
  );
  const pages: FramePage<SkeletonPageModel, SkeletonMsg>[] = pageSpecs.map(
    (spec) => {
      const config = pageConfigFor(spec);
      return {
        id: spec.tab.id,
        title: spec.tab.title,
        init: () => [createInitialPageModel(config), []],
        update(msg: FramePageMsg<SkeletonMsg>, model: SkeletonPageModel) {
          return updateSkeletonPage(msg, model, config);
        },
        layout: (model) => layoutFor(spec, options.ctx, model),
        keyMap: config.hasDrawer
          ? createKeyMap<SkeletonMsg>().group('Page', (group) =>
            group.bind('o', 'Toggle drawer', { type: 'toggle-drawer' }),
          )
          : undefined,
      };
    },
  );
  const defaultGlobalKeys = createKeyMap<SkeletonMsg>().group(
    'Global',
    (group) => group
      .bind('q', 'Quit (confirm)', { type: 'request-quit' })
      .bind('ctrl+c', 'Quit (confirm)', { type: 'request-quit' })
      .bind('y', 'Confirm quit', { type: 'confirm-quit' })
      .bind('enter', 'Confirm quit', { type: 'confirm-quit' })
      .bind('n', 'Cancel quit', { type: 'cancel-quit' })
      .bind('escape', 'Cancel quit', { type: 'cancel-quit' }),
  );

  return createFramedApp({
    title: options.title ?? 'App',
    pages,
    defaultPageId: options.defaultTabId != null
      && tabsById.has(options.defaultTabId)
      ? options.defaultTabId
      : first.id,
    bodyTopRows: 2,
    bodyBottomRows: 3,
    globalKeys: mergeKeyMaps(defaultGlobalKeys, options.globalKeys),
    enableCommandPalette: true,
    overlayFactory: (frame) => buildSkeletonOverlays({
      frame,
      tabsById,
      allTabs: tabs,
      pageConfigs,
      title: options.title ?? 'App',
      keyLegend: options.keyLegend ?? DEFAULT_KEY_LEGEND,
      statusMessage: options.statusMessage,
      tokens: options.themeTokens,
      ctx: options.ctx,
    }),
  });
}
