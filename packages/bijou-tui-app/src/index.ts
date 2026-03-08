import type { BijouContext, TokenValue } from '@flyingrobots/bijou';
import {
  animate,
  clipToWidth,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  drawer,
  formatKeyCombo,
  modal,
  quit,
  statusBar,
  visibleLength,
  type App,
  type Cmd,
  type FrameLayoutNode,
  type FrameModel,
  type FrameOverlayContext,
  type FramePage,
  type KeyCombo,
  type KeyMap,
  type KeyMsg,
  type Overlay,
} from '@flyingrobots/bijou-tui';

/** Single top-level tab in the app skeleton. */
export interface SkeletonTab {
  /** Stable tab id. */
  readonly id: string;
  /** Visible tab label. */
  readonly title: string;
}

/** Resolved active-tab metadata for dynamic status rendering. */
export interface SkeletonStatusContext {
  /** Active tab id. */
  readonly activeTabId: string;
  /** Active tab title. */
  readonly activeTabTitle: string;
}

/** Optional token overrides for shell chrome regions. */
export interface SkeletonThemeTokens {
  /** Header background token for non-tab space. Defaults to `surface.primary`. */
  readonly headerBgToken?: TokenValue;
  /** Active tab token. Defaults to `surface.elevated`. */
  readonly activeTabToken?: TokenValue;
  /** Inactive tab token. Defaults to `surface.secondary`. */
  readonly inactiveTabToken?: TokenValue;
  /** Footer status-line token. Defaults to `surface.secondary`. */
  readonly footerStatusToken?: TokenValue;
  /** Footer controls-line token. Defaults to `surface.primary`. */
  readonly footerControlsToken?: TokenValue;
  /** Separator row token. Defaults to `border.muted`. */
  readonly separatorToken?: TokenValue;
  /** Drawer border token. Defaults to `border.primary`. */
  readonly drawerBorderToken?: TokenValue;
  /** Drawer background token. Defaults to `surface.overlay`. */
  readonly drawerBgToken?: TokenValue;
  /** Quit modal border token. Defaults to `border.warning`. */
  readonly modalBorderToken?: TokenValue;
  /** Quit modal background token. Defaults to `surface.overlay`. */
  readonly modalBgToken?: TokenValue;
}

/** Options for creating a batteries-included app skeleton. */
export interface CreateTuiAppSkeletonOptions {
  /** Bijou context for theme + style rendering. */
  readonly ctx: BijouContext;
  /** App title shown in the header line below tabs. */
  readonly title?: string;
  /**
   * Tabs shown on the top row.
   *
   * Defaults to two tabs:
   * 1. drawer page (empty main pane + animated drawer)
   * 2. split page (1/3 + 2/3)
   */
  readonly tabs?: readonly SkeletonTab[];
  /** Optional default tab id. Falls back to first tab. */
  readonly defaultTabId?: string;
  /**
   * Footer key legend for controls row.
   *
   * Defaults to:
   * `[ ] pages | o drawer | tab panes | ctrl+p commands | q quit`
   */
  readonly keyLegend?: string;
  /** Footer status message (static or dynamic by active tab). */
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  /** Optional shell token overrides. */
  readonly themeTokens?: SkeletonThemeTokens;
  /** Optional extra global key bindings merged into skeleton defaults. */
  readonly globalKeys?: KeyMap<SkeletonMsg>;
}

/** Internal page model used for defaults. */
interface SkeletonPageModel {
  readonly ready: true;
  readonly drawerOpen: boolean;
  readonly drawerProgress: number;
  readonly quitConfirmOpen: boolean;
}

/** Per-page configuration derived from the page spec (drawer vs. split vs. empty). */
interface SkeletonPageConfig {
  readonly hasDrawer: boolean;
  readonly drawerPaneId?: string;
}

/** Describes a page's tab and layout kind before rendering. */
interface SkeletonPageSpec {
  readonly tab: SkeletonTab;
  readonly kind: 'drawer' | 'split' | 'empty';
}

/** Messages used by the skeleton app shell. */
export type SkeletonMsg =
  | { type: 'request-quit' }
  | { type: 'confirm-quit' }
  | { type: 'cancel-quit' }
  | { type: 'toggle-drawer' }
  | { type: 'drawer-progress'; value: number };

const DEFAULT_TABS: readonly SkeletonTab[] = [
  { id: 'home', title: 'Home' },
  { id: 'split', title: 'Split' },
];

const DEFAULT_KEY_LEGEND = '[ ] pages | o drawer | tab panes | ctrl+p commands | q quit';

const DEFAULT_SPLIT_STATE = createSplitPaneState({ ratio: 1 / 3 });

/**
 * Create a full-screen framed app skeleton with:
 * - tabbed top bar (`|` separators, active/inactive surface tokens)
 * - header line
 * - animated physics drawer on tab 1 (`o` to toggle)
 * - tab switching with `[` and `]` (frame defaults)
 * - quit confirmation modal (`q` / `ctrl+c`)
 * - two-line footer (status line + controls line)
 * - full-width `\\` separator row above footer
 * - default 2-tab setup (drawer page + 1/3:2/3 split page)
 */
export function createTuiAppSkeleton(
  options: CreateTuiAppSkeletonOptions,
): App<FrameModel<SkeletonPageModel>, SkeletonMsg> {
  const tabs = options.tabs ?? DEFAULT_TABS;
  if (tabs.length === 0) {
    throw new Error('createTuiAppSkeleton: "tabs" must contain at least one tab');
  }

  const tabsById = new Map(tabs.map((tab) => [tab.id, tab] as const));
  const pageSpecs = buildPageSpecs(tabs);
  const pageConfigs = new Map(pageSpecs.map((spec) => [spec.tab.id, pageConfigFor(spec)] as const));

  const pages: FramePage<SkeletonPageModel, SkeletonMsg>[] = pageSpecs.map((spec) => {
    const config = pageConfigFor(spec);
    return {
      id: spec.tab.id,
      title: spec.tab.title,
      init: () => [createInitialPageModel(config), []],
      update(msg, model) {
        return updateSkeletonPage(msg, model, config);
      },
      layout: () => layoutFor(spec),
      keyMap: config.hasDrawer
        ? createKeyMap<SkeletonMsg>().group('Page', (group) => group
          .bind('o', 'Toggle drawer', { type: 'toggle-drawer' }),
        )
        : undefined,
    };
  });

  const defaultGlobalKeys = createKeyMap<SkeletonMsg>()
    .group('Global', (group) => group
      .bind('q', 'Quit (confirm)', { type: 'request-quit' })
      .bind('ctrl+c', 'Quit (confirm)', { type: 'request-quit' })
      .bind('y', 'Confirm quit', { type: 'confirm-quit' })
      .bind('enter', 'Confirm quit', { type: 'confirm-quit' })
      .bind('n', 'Cancel quit', { type: 'cancel-quit' })
      .bind('escape', 'Cancel quit', { type: 'cancel-quit' }),
    );

  const mergedGlobalKeys = mergeKeyMaps(defaultGlobalKeys, options.globalKeys);

  return createFramedApp<SkeletonPageModel, SkeletonMsg>({
    title: options.title ?? 'App',
    pages,
    defaultPageId: options.defaultTabId ?? tabs[0]!.id,
    globalKeys: mergedGlobalKeys,
    enableCommandPalette: true,
    overlayFactory: (frame) =>
      buildSkeletonOverlays({
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

/** Everything needed to build the skeleton app's overlay stack. */
interface OverlayBuildOptions {
  readonly frame: FrameOverlayContext<SkeletonPageModel>;
  readonly tabsById: ReadonlyMap<string, SkeletonTab>;
  readonly allTabs: readonly SkeletonTab[];
  readonly pageConfigs: ReadonlyMap<string, SkeletonPageConfig>;
  readonly title: string;
  readonly keyLegend: string;
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  readonly tokens?: SkeletonThemeTokens;
  readonly ctx: BijouContext;
}

/** Assemble the full overlay stack (tab bar, header, drawer, footer, quit modal). */
function buildSkeletonOverlays(options: OverlayBuildOptions): readonly Overlay[] {
  const width = Math.max(0, options.frame.screenRect.width);
  const height = Math.max(0, options.frame.screenRect.height);
  if (width <= 0 || height <= 0) return [];

  const activeTab = options.tabsById.get(options.frame.activePageId) ?? options.allTabs[0]!;
  const pageConfig = options.pageConfigs.get(activeTab.id) ?? { hasDrawer: false };

  const resolvedStatus = typeof options.statusMessage === 'function'
    ? options.statusMessage({ activeTabId: activeTab.id, activeTabTitle: activeTab.title })
    : (options.statusMessage ?? `${activeTab.title} ready`);

  const overlays: Overlay[] = [];

  overlays.push({
    row: 0,
    col: 0,
    content: renderTabRow(width, options.allTabs, activeTab.id, options.tokens, options.ctx),
  });

  if (height >= 5) {
    overlays.push({
      row: 1,
      col: 0,
      content: renderHeaderRow(width, options.title, activeTab.title, options.tokens, options.ctx),
    });
  }

  const drawerOverlay = maybeRenderDrawerOverlay(options.frame, pageConfig, width, height, options.tokens, options.ctx);
  if (drawerOverlay != null) overlays.push(drawerOverlay);

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
      content: renderFooterStatusRow(width, resolvedStatus, activeTab.title, options.tokens, options.ctx),
    });

    overlays.push({
      row: height - 1,
      col: 0,
      content: renderFooterControlsRow(width, options.keyLegend, options.tokens, options.ctx),
    });
  } else if (height === 2) {
    overlays.push({
      row: 1,
      col: 0,
      content: renderFooterControlsRow(width, options.keyLegend, options.tokens, options.ctx),
    });
  }

  if (options.frame.pageModel.quitConfirmOpen) {
    overlays.push(modal({
      title: 'Quit App?',
      body: 'Exit this TUI session now?',
      hint: 'Y / Enter confirm  •  N / Esc cancel',
      width: Math.min(56, Math.max(34, width - 4)),
      screenWidth: width,
      screenHeight: height,
      borderToken: options.tokens?.modalBorderToken ?? options.ctx.theme.theme.border.warning,
      bgToken: options.tokens?.modalBgToken ?? options.ctx.theme.theme.surface.overlay,
      ctx: options.ctx,
    }));
  }

  return overlays;
}

/** Render the top tab bar with active/inactive styling and separators. */
function renderTabRow(
  width: number,
  tabs: readonly SkeletonTab[],
  activeTabId: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const headerBg = tokens?.headerBgToken ?? ctx.theme.theme.surface.primary;
  const activeToken = tokens?.activeTabToken ?? ctx.theme.theme.surface.elevated;
  const inactiveToken = tokens?.inactiveTabToken ?? ctx.theme.theme.surface.secondary;

  const separator = style(' | ', headerBg, ctx);
  const tabsRaw = tabs
    .map((tab) => style(` ${tab.title} `, tab.id === activeTabId ? activeToken : inactiveToken, ctx))
    .join(separator);

  return fillToWidth(tabsRaw, width, headerBg, ctx);
}

/** Render the header row with app title and active tab name. */
function renderHeaderRow(
  width: number,
  title: string,
  activeTabTitle: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const headerBg = tokens?.headerBgToken ?? ctx.theme.theme.surface.primary;
  const line = statusBar({
    left: ` ${title}`,
    right: activeTabTitle,
    width,
  });
  return style(line, headerBg, ctx);
}

/** Render a full-width diagonal separator line above the footer. */
function renderSeparatorRow(
  width: number,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const separatorToken = tokens?.separatorToken ?? ctx.theme.theme.border.muted;
  return style('\\'.repeat(width), separatorToken, ctx);
}

/** Render the footer status bar with status message and tab name. */
function renderFooterStatusRow(
  width: number,
  status: string,
  activeTabTitle: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const footerToken = tokens?.footerStatusToken ?? ctx.theme.theme.surface.secondary;
  const line = statusBar({
    left: ` ${status}`,
    right: activeTabTitle,
    width,
  });
  return style(line, footerToken, ctx);
}

/** Render the bottom footer line showing the key legend. */
function renderFooterControlsRow(
  width: number,
  keyLegend: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const controlsToken = tokens?.footerControlsToken ?? ctx.theme.theme.surface.primary;
  const line = statusBar({
    left: ` ${keyLegend}`,
    right: '',
    width,
  });
  return style(line, controlsToken, ctx);
}

/** Build the drawer overlay if the page supports it and the animation progress is visible. */
function maybeRenderDrawerOverlay(
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

  const region = pageConfig.drawerPaneId != null
    ? (frame.paneRects.get(pageConfig.drawerPaneId) ?? frame.screenRect)
    : frame.screenRect;

  if (region.width <= 0 || region.height <= 0) return null;

  const idealOpenWidth = Math.max(22, Math.floor(region.width * 0.38));
  const openWidth = clampInt(idealOpenWidth, 0, region.width);
  const animatedWidth = clampInt(Math.round(openWidth * progress), 0, region.width);
  if (animatedWidth < 6) return null;

  return drawer({
    anchor: 'right',
    title: 'Drawer',
    content: renderDrawerContent(frame.pageModel),
    width: animatedWidth,
    screenWidth: width,
    screenHeight: height,
    region,
    borderToken: tokens?.drawerBorderToken ?? ctx.theme.theme.border.primary,
    bgToken: tokens?.drawerBgToken ?? ctx.theme.theme.surface.overlay,
    ctx,
  });
}

/** Produce the static content shown inside the drawer panel. */
function renderDrawerContent(model: SkeletonPageModel): string {
  const pct = Math.round(clamp01(model.drawerProgress) * 100);
  return [
    'Panel drawer',
    '',
    `Open: ${model.drawerOpen ? 'yes' : 'no'}`,
    `Width: ${pct}%`,
    '',
    'o        toggle drawer',
    '[ / ]    switch pages',
    'q        quit (confirm)',
  ].join('\n');
}

/** Map each tab to a page spec with a layout kind (drawer, split, or empty). */
function buildPageSpecs(tabs: readonly SkeletonTab[]): readonly SkeletonPageSpec[] {
  return tabs.map((tab, index) => ({
    tab,
    kind: index === 0 ? 'drawer' : (index === 1 ? 'split' : 'empty'),
  }));
}

/** Derive per-page configuration (drawer pane ID, etc.) from a page spec. */
function pageConfigFor(spec: SkeletonPageSpec): SkeletonPageConfig {
  if (spec.kind === 'drawer') {
    return {
      hasDrawer: true,
      drawerPaneId: drawerPaneId(spec.tab.id),
    };
  }
  return { hasDrawer: false };
}

/** Create the initial model for a skeleton page based on its config. */
function createInitialPageModel(config: SkeletonPageConfig): SkeletonPageModel {
  return {
    ready: true,
    drawerOpen: config.hasDrawer,
    drawerProgress: config.hasDrawer ? 1 : 0,
    quitConfirmOpen: false,
  };
}

/** TEA update handler for skeleton page messages (quit, drawer toggle, etc.). */
function updateSkeletonPage(
  msg: SkeletonMsg,
  model: SkeletonPageModel,
  config: SkeletonPageConfig,
): [SkeletonPageModel, Cmd<SkeletonMsg>[]] {
  switch (msg.type) {
    case 'request-quit':
      if (model.quitConfirmOpen) return [model, []];
      return [{ ...model, quitConfirmOpen: true }, []];

    case 'cancel-quit':
      if (!model.quitConfirmOpen) return [model, []];
      return [{ ...model, quitConfirmOpen: false }, []];

    case 'confirm-quit':
      if (!model.quitConfirmOpen) return [model, []];
      return [{ ...model, quitConfirmOpen: false }, [quit()]];

    case 'toggle-drawer': {
      if (!config.hasDrawer) return [model, []];
      const drawerOpen = !model.drawerOpen;
      const target = drawerOpen ? 1 : 0;
      return [{ ...model, drawerOpen }, [
        animate<SkeletonMsg>({
          from: model.drawerProgress,
          to: target,
          spring: 'default',
          onFrame: (value) => ({ type: 'drawer-progress', value }),
        }),
      ]];
    }

    case 'drawer-progress':
      if (!config.hasDrawer) return [model, []];
      return [{ ...model, drawerProgress: clamp01(msg.value) }, []];
  }
}

/** Build the layout tree for a skeleton page (single pane, split, or empty). */
function layoutFor(spec: SkeletonPageSpec): FrameLayoutNode {
  switch (spec.kind) {
    case 'drawer':
      return {
        kind: 'pane',
        paneId: drawerPaneId(spec.tab.id),
        render: () => '',
      };

    case 'split':
      return {
        kind: 'split',
        splitId: `${spec.tab.id}-split`,
        direction: 'row',
        state: DEFAULT_SPLIT_STATE,
        paneA: {
          kind: 'pane',
          paneId: `${spec.tab.id}-left`,
          render: (width, height) => renderSplitPaneLabel('Left pane (1/3)', width, height),
        },
        paneB: {
          kind: 'pane',
          paneId: `${spec.tab.id}-right`,
          render: (width, height) => renderSplitPaneLabel('Right pane (2/3)', width, height),
        },
      };

    case 'empty':
      return {
        kind: 'pane',
        paneId: `${spec.tab.id}-main`,
        render: () => '',
      };
  }
}

/** Render a centered label inside a split pane for the skeleton demo. */
function renderSplitPaneLabel(label: string, width: number, height: number): string {
  if (width <= 0 || height <= 0) return '';
  const first = clipToWidth(` ${label}`, width);
  const lines: string[] = [first];
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}

/** Derive the drawer pane ID from a tab ID. */
function drawerPaneId(tabId: string): string {
  return `${tabId}-main`;
}

/** Pad styled content with token-styled spaces to fill exactly `width` columns. */
function fillToWidth(content: string, width: number, token: TokenValue, ctx: BijouContext): string {
  const clipped = clipToWidth(content, width);
  const visible = visibleLength(clipped);
  if (visible >= width) return clipped;
  return clipped + style(' '.repeat(width - visible), token, ctx);
}

/** Apply a design token's style to text, returning unstyled for empty strings. */
function style(text: string, token: TokenValue, ctx: BijouContext): string {
  if (text.length === 0) return '';
  return ctx.style.styled(token, text);
}

/** Combine a base and optional extra key map into a new merged key map. */
function mergeKeyMaps<M>(base: KeyMap<M>, extra: KeyMap<M> | undefined): KeyMap<M> {
  if (extra == null) return base;
  const merged = createKeyMap<M>();
  bindMapInto(merged, base);
  bindMapInto(merged, extra);
  return merged;
}

/** Copy all enabled bindings from a source key map into a target key map. */
function bindMapInto<M>(target: KeyMap<M>, source: KeyMap<M>): void {
  for (const binding of source.bindings()) {
    if (!binding.enabled) continue;
    const action = source.handle(comboToMsg(binding.combo));
    if (action === undefined) continue;
    if (binding.group !== '') {
      target.group(binding.group, (group) => group.bind(formatKeyCombo(binding.combo), binding.description, action));
    } else {
      target.bind(formatKeyCombo(binding.combo), binding.description, action);
    }
  }
}

/** Convert a key combo into a synthetic KeyMsg for dispatch. */
function comboToMsg(combo: KeyCombo): KeyMsg {
  return {
    type: 'key',
    key: combo.key,
    ctrl: combo.ctrl,
    alt: combo.alt,
    shift: combo.shift,
  };
}

/** Clamp a number to the 0–1 range, treating non-finite as 0. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Floor and clamp a number between min and max. */
function clampInt(value: number, min: number, max: number): number {
  const floored = Math.floor(value);
  return Math.max(min, Math.min(max, floored));
}
