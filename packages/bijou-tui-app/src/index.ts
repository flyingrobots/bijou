import type { BijouContext, TokenValue } from '@flyingrobots/bijou';
import {
  clipToWidth,
  createFramedApp,
  createKeyMap,
  formatKeyCombo,
  quit,
  statusBar,
  visibleLength,
  type App,
  type Cmd,
  type FrameLayoutNode,
  type FrameModel,
  type FrameOverlayContext,
  type FramePage,
  type KeyMap,
  type KeyCombo,
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
  /** Footer gutter token. Defaults to `surface.secondary`. */
  readonly footerToken?: TokenValue;
  /** Separator row token. Defaults to `border.muted`. */
  readonly separatorToken?: TokenValue;
}

/** Options for creating a batteries-included app skeleton. */
export interface CreateTuiAppSkeletonOptions {
  /** Bijou context for theme + style rendering. */
  readonly ctx: BijouContext;
  /** App title shown in the header line below tabs. */
  readonly title?: string;
  /** Tabs shown on the top row. Must be non-empty. */
  readonly tabs: readonly SkeletonTab[];
  /** Optional default tab id. Falls back to first tab. */
  readonly defaultTabId?: string;
  /**
   * Footer key legend. Defaults to:
   * `[ ] tabs | tab panes | ctrl+p commands | ? help | q quit`
   */
  readonly keyLegend?: string;
  /** Footer status message (static or dynamic by active tab). */
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  /** Optional shell token overrides. */
  readonly themeTokens?: SkeletonThemeTokens;
  /** Optional extra global key bindings merged into skeleton defaults. */
  readonly globalKeys?: KeyMap<SkeletonMsg>;
}

/** Internal no-op page model for empty skeleton pages. */
interface SkeletonPageModel {
  readonly ready: true;
}

/** Messages used by the skeleton app shell. */
export type SkeletonMsg = { type: 'quit' };

const EMPTY_LAYOUT: FrameLayoutNode = {
  kind: 'grid',
  gridId: 'skeleton-empty',
  columns: ['1fr'],
  rows: ['1fr'],
  areas: ['.'],
  cells: {},
};

/**
 * Create a full-screen framed app skeleton with:
 * - tabbed top bar (`|` separators, active/inactive surface tokens)
 * - header line
 * - footer gutter with key legend + status text
 * - full-width `\` separator row above footer
 * - empty content frame per tab (drop in your own page layouts later)
 */
export function createTuiAppSkeleton(
  options: CreateTuiAppSkeletonOptions,
): App<FrameModel<SkeletonPageModel>, SkeletonMsg> {
  if (options.tabs.length === 0) {
    throw new Error('createTuiAppSkeleton: "tabs" must contain at least one tab');
  }

  const tabsById = new Map(options.tabs.map((tab) => [tab.id, tab] as const));
  const pages: FramePage<SkeletonPageModel, SkeletonMsg>[] = options.tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    init: () => [{ ready: true }, []],
    update(msg, model): [SkeletonPageModel, Cmd<SkeletonMsg>[]] {
      if (msg.type === 'quit') return [model, [quit()]];
      return [model, []];
    },
    layout: () => EMPTY_LAYOUT,
  }));

  const defaultGlobalKeys = createKeyMap<SkeletonMsg>()
    .group('Global', (group) => group
      .bind('q', 'Quit', { type: 'quit' })
      .bind('ctrl+c', 'Quit', { type: 'quit' }),
    );

  const mergedGlobalKeys = mergeKeyMaps(defaultGlobalKeys, options.globalKeys);

  return createFramedApp<SkeletonPageModel, SkeletonMsg>({
    title: options.title ?? 'App',
    pages,
    defaultPageId: options.defaultTabId ?? options.tabs[0]!.id,
    globalKeys: mergedGlobalKeys,
    enableCommandPalette: true,
    overlayFactory: (frame) =>
      buildSkeletonOverlays({
        frame,
        tabsById,
        allTabs: options.tabs,
        title: options.title ?? 'App',
        keyLegend:
          options.keyLegend ??
          '[ ] tabs | tab panes | ctrl+p commands | ? help | q quit',
        statusMessage: options.statusMessage,
        tokens: options.themeTokens,
        ctx: options.ctx,
      }),
  });
}

interface OverlayBuildOptions {
  readonly frame: FrameOverlayContext<SkeletonPageModel>;
  readonly tabsById: ReadonlyMap<string, SkeletonTab>;
  readonly allTabs: readonly SkeletonTab[];
  readonly title: string;
  readonly keyLegend: string;
  readonly statusMessage?: string | ((ctx: SkeletonStatusContext) => string);
  readonly tokens?: SkeletonThemeTokens;
  readonly ctx: BijouContext;
}

function buildSkeletonOverlays(options: OverlayBuildOptions): readonly Overlay[] {
  const width = Math.max(0, options.frame.screenRect.width);
  const height = Math.max(0, options.frame.screenRect.height);
  if (width <= 0 || height <= 0) return [];

  const activeTab = options.tabsById.get(options.frame.activePageId) ?? options.allTabs[0]!;
  const resolvedStatus = typeof options.statusMessage === 'function'
    ? options.statusMessage({ activeTabId: activeTab.id, activeTabTitle: activeTab.title })
    : (options.statusMessage ?? `${activeTab.title} ready`);

  const overlays: Overlay[] = [];
  overlays.push({
    row: 0,
    col: 0,
    content: renderTabRow(width, options.allTabs, activeTab.id, options.tokens, options.ctx),
  });

  if (height >= 4) {
    overlays.push({
      row: 1,
      col: 0,
      content: renderHeaderRow(width, options.title, activeTab.title, options.tokens, options.ctx),
    });
  }

  if (height >= 3) {
    overlays.push({
      row: height - 2,
      col: 0,
      content: renderSeparatorRow(width, options.tokens, options.ctx),
    });
    overlays.push({
      row: height - 1,
      col: 0,
      content: renderFooterRow(width, options.keyLegend, resolvedStatus, options.tokens, options.ctx),
    });
  } else if (height === 2) {
    overlays.push({
      row: 1,
      col: 0,
      content: renderFooterRow(width, options.keyLegend, resolvedStatus, options.tokens, options.ctx),
    });
  }

  return overlays;
}

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

function renderSeparatorRow(
  width: number,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const separatorToken = tokens?.separatorToken ?? ctx.theme.theme.border.muted;
  return style('\\'.repeat(width), separatorToken, ctx);
}

function renderFooterRow(
  width: number,
  keyLegend: string,
  status: string,
  tokens: SkeletonThemeTokens | undefined,
  ctx: BijouContext,
): string {
  const footerToken = tokens?.footerToken ?? ctx.theme.theme.surface.secondary;
  const line = statusBar({
    left: keyLegend,
    right: status,
    width,
  });
  return style(line, footerToken, ctx);
}

function fillToWidth(content: string, width: number, token: TokenValue, ctx: BijouContext): string {
  const clipped = clipToWidth(content, width);
  const visible = visibleLength(clipped);
  if (visible >= width) return clipped;
  return clipped + style(' '.repeat(width - visible), token, ctx);
}

function style(text: string, token: TokenValue, ctx: BijouContext): string {
  if (text.length === 0) return '';
  return ctx.style.styled(token, text);
}

function mergeKeyMaps<M>(base: KeyMap<M>, extra: KeyMap<M> | undefined): KeyMap<M> {
  if (extra == null) return base;
  const merged = createKeyMap<M>();
  bindMapInto(merged, base);
  bindMapInto(merged, extra);
  return merged;
}

function bindMapInto<M>(target: KeyMap<M>, source: KeyMap<M>): void {
  for (const binding of source.bindings()) {
    if (!binding.enabled) continue;
    const action = source.handle(comboToMsg(binding.combo));
    if (action === undefined) continue;
    target.bind(formatKeyCombo(binding.combo), binding.description, action);
  }
}

function comboToMsg(combo: KeyCombo): KeyMsg {
  return {
    type: 'key',
    key: combo.key,
    ctrl: combo.ctrl,
    alt: combo.alt,
    shift: combo.shift,
  };
}
