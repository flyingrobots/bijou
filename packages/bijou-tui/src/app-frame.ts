/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import { helpShort, helpView, type BindingSource } from './help.js';
import {
  createKeyMap,
  formatKeyCombo,
  type BindingInfo,
  type KeyMap,
} from './keybindings.js';
import type { App, Cmd, KeyMsg } from './types.js';
import { isKeyMsg, isResizeMsg } from './types.js';
import type { Overlay } from './overlay.js';
import { composite, modal } from './overlay.js';
import type { CommandPaletteItem, CommandPaletteState } from './command-palette.js';
import {
  commandPalette,
  commandPaletteKeyMap,
  createCommandPaletteState,
  cpFilter,
  cpFocusNext,
  cpFocusPrev,
  cpPageDown,
  cpPageUp,
  cpSelectedItem,
} from './command-palette.js';
import type { GridTrack } from './grid.js';
import { grid, gridLayout } from './grid.js';
import {
  createFocusAreaState,
  focusArea,
  focusAreaPageDown,
  focusAreaPageUp,
  focusAreaScrollBy,
  focusAreaScrollByX,
  focusAreaScrollToBottom,
  focusAreaScrollToTop,
  focusAreaScrollTo,
  focusAreaScrollToX,
  type OverflowX,
} from './focus-area.js';
import {
  splitPane,
  splitPaneLayout,
  type SplitPaneDirection,
  type SplitPaneState,
} from './split-pane.js';
import type { LayoutRect } from './layout-rect.js';
import { clipToWidth, visibleLength } from './viewport.js';

/** Page declaration consumed by {@link createFramedApp}. */
export interface FramePage<PageModel, Msg> {
  /** Stable page id. */
  readonly id: string;
  /** Tab title. */
  readonly title: string;
  /** Page-level initializer. */
  init(): [PageModel, Cmd<Msg>[]];
  /** Page-level updater (custom messages only). */
  update(msg: Msg, model: PageModel): [PageModel, Cmd<Msg>[]];
  /** Page layout tree. */
  layout(model: PageModel): FrameLayoutNode;
  /** Optional page keymap. */
  keyMap?: KeyMap<Msg>;
  /** Optional help source override. */
  helpSource?: BindingSource;
  /** Optional page-scoped command items for command palette listing. */
  commandItems?: (model: PageModel) => readonly CommandPaletteItem[];
}

/** Declarative frame layout node. */
export type FrameLayoutNode =
  | {
    readonly kind: 'pane';
    readonly paneId: string;
    readonly render: (width: number, height: number) => string;
    readonly overflowX?: OverflowX;
  }
  | {
    readonly kind: 'split';
    readonly splitId: string;
    readonly direction?: SplitPaneDirection;
    readonly state: SplitPaneState;
    readonly minA?: number;
    readonly minB?: number;
    readonly paneA: FrameLayoutNode;
    readonly paneB: FrameLayoutNode;
    readonly dividerChar?: string;
  }
  | {
    readonly kind: 'grid';
    readonly gridId: string;
    readonly columns: readonly GridTrack[];
    readonly rows: readonly GridTrack[];
    readonly areas: readonly string[];
    readonly gap?: number;
    readonly cells: Readonly<Record<string, FrameLayoutNode>>;
  };

/** Context passed to overlay factory. */
export interface FrameOverlayContext<PageModel> {
  /** Active page id. */
  readonly activePageId: string;
  /** Active page model. */
  readonly pageModel: PageModel;
  /** Absolute pane rectangles for the active page. */
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  /** Full-screen bounds. */
  readonly screenRect: LayoutRect;
}

/** `createFramedApp()` options. */
export interface CreateFramedAppOptions<PageModel, Msg> {
  /** Registered pages. */
  readonly pages: readonly FramePage<PageModel, Msg>[];
  /** Optional default page id (falls back to first page). */
  readonly defaultPageId?: string;
  /** Optional frame title. */
  readonly title?: string;
  /** Optional global keymap layered above page keymap. */
  readonly globalKeys?: KeyMap<Msg>;
  /** Enable frame-level command palette (`ctrl+p` / `:`). */
  readonly enableCommandPalette?: boolean;
  /** Optional overlay provider (receives pane rects for panel scoping). */
  readonly overlayFactory?: (ctx: FrameOverlayContext<PageModel>) => readonly Overlay[];
}

/** Stored pane scroll coordinates. */
export interface FramePaneScroll {
  /** Horizontal offset. */
  readonly x: number;
  /** Vertical offset. */
  readonly y: number;
}

/** Runtime model owned by the frame. */
export interface FrameModel<PageModel> {
  /** Current active page id. */
  readonly activePageId: string;
  /** Stable page order. */
  readonly pageOrder: readonly string[];
  /** Current model per page id. */
  readonly pageModels: Readonly<Record<string, PageModel>>;
  /** Focused pane id per page (if any). */
  readonly focusedPaneByPage: Readonly<Record<string, string | undefined>>;
  /** Per-page/per-pane scroll positions. */
  readonly scrollByPage: Readonly<Record<string, Readonly<Record<string, FramePaneScroll>>>>;
  /** Current terminal width. */
  readonly columns: number;
  /** Current terminal height. */
  readonly rows: number;
  /** Help visibility flag. */
  readonly helpOpen: boolean;
  /** Command palette state (undefined when closed). */
  readonly commandPalette?: CommandPaletteState;
}

interface InternalFrameModel<PageModel, Msg> extends FrameModel<PageModel> {
  readonly commandPaletteEntries?: readonly PaletteEntry<Msg>[];
}

interface PaletteEntry<Msg> {
  readonly id: string;
  readonly item: CommandPaletteItem;
  readonly msgAction?: Msg;
  readonly frameAction?: FrameAction;
}

interface RenderContext<PageModel, Msg> {
  readonly model: InternalFrameModel<PageModel, Msg>;
  readonly pageId: string;
  readonly focusedPaneId: string | undefined;
  readonly scrollByPane: Readonly<Record<string, FramePaneScroll>>;
}

interface RenderResult {
  readonly output: string;
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

type FrameAction =
  | { type: 'toggle-help' }
  | { type: 'prev-tab' }
  | { type: 'next-tab' }
  | { type: 'next-pane' }
  | { type: 'prev-pane' }
  | { type: 'scroll-up' }
  | { type: 'scroll-down' }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'scroll-left' }
  | { type: 'scroll-right' }
  | { type: 'open-palette' };

type PaletteAction =
  | { type: 'cp-next' }
  | { type: 'cp-prev' }
  | { type: 'cp-page-down' }
  | { type: 'cp-page-up' }
  | { type: 'cp-select' }
  | { type: 'cp-close' };

/**
 * Create a fully framed TEA app shell.
 */
export function createFramedApp<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
): App<FrameModel<PageModel>, Msg> {
  if (options.pages.length === 0) {
    throw new Error('createFramedApp: "pages" must contain at least one page');
  }

  const pagesById = new Map<string, FramePage<PageModel, Msg>>();
  for (const page of options.pages) {
    if (pagesById.has(page.id)) {
      throw new Error(`createFramedApp: duplicate page id "${page.id}"`);
    }
    pagesById.set(page.id, page);
  }

  const pageOrder = options.pages.map((p) => p.id);
  const defaultPageId = options.defaultPageId ?? pageOrder[0]!;
  if (!pagesById.has(defaultPageId)) {
    throw new Error(`createFramedApp: defaultPageId "${defaultPageId}" not found in pages`);
  }

  const frameKeys = createFrameKeyMap();
  const paletteKeys = commandPaletteKeyMap<PaletteAction>({
    focusNext: { type: 'cp-next' },
    focusPrev: { type: 'cp-prev' },
    pageDown: { type: 'cp-page-down' },
    pageUp: { type: 'cp-page-up' },
    select: { type: 'cp-select' },
    close: { type: 'cp-close' },
  });

  const app: App<InternalFrameModel<PageModel, Msg>, Msg> = {
    init() {
      const pageModels: Record<string, PageModel> = {};
      const initCmds: Cmd<Msg>[] = [];

      for (const page of options.pages) {
        const [pageModel, cmds] = page.init();
        pageModels[page.id] = pageModel;
        initCmds.push(...cmds);
      }

      let model: InternalFrameModel<PageModel, Msg> = {
        activePageId: defaultPageId,
        pageOrder,
        pageModels,
        focusedPaneByPage: {},
        scrollByPage: {},
        columns: process.stdout.columns ?? 80,
        rows: process.stdout.rows ?? 24,
        helpOpen: false,
      };

      for (const pageId of pageOrder) {
        model = syncPageFrameState(model, pageId, pagesById);
      }

      return [model, initCmds];
    },

    update(msg, model) {
      if (isResizeMsg(msg)) {
        return [{
          ...model,
          columns: msg.columns,
          rows: msg.rows,
        }, []];
      }

      if (isKeyMsg(msg)) {
        if (model.helpOpen && msg.key === 'escape' && !msg.ctrl && !msg.alt) {
          return [{ ...model, helpOpen: false }, []];
        }

        if (model.commandPalette != null) {
          return handlePaletteKey(msg, model, paletteKeys, frameKeys, options, pagesById);
        }

        const frameAction = frameKeys.handle(msg);
        if (frameAction !== undefined) {
          return applyFrameAction(frameAction, model, frameKeys, options, pagesById);
        }

        const globalAction = options.globalKeys?.handle(msg);
        if (globalAction !== undefined) {
          return [model, [emitMsg(globalAction)]];
        }

        const activePage = pagesById.get(model.activePageId)!;
        const pageAction = activePage.keyMap?.handle(msg);
        if (pageAction !== undefined) {
          return [model, [emitMsg(pageAction)]];
        }

        return [model, []];
      }

      // Custom message path: delegate only to active page.
      const page = pagesById.get(model.activePageId)!;
      const pageModel = model.pageModels[model.activePageId]!;
      const [nextPageModel, cmds] = page.update(msg as Msg, pageModel);
      const nextModels = { ...model.pageModels, [model.activePageId]: nextPageModel };
      const synced = syncPageFrameState({ ...model, pageModels: nextModels }, model.activePageId, pagesById);
      return [synced, cmds];
    },

    view(model) {
      const activePage = pagesById.get(model.activePageId)!;
      const activePageModel = model.pageModels[model.activePageId]!;

      const header = renderHeaderLine(model, options, pagesById);
      const helpLine = renderHelpLine(model, frameKeys, options, activePage);
      const bodyRect = frameBodyRect(model.columns, model.rows);

      const renderCtx: RenderContext<PageModel, Msg> = {
        model,
        pageId: model.activePageId,
        focusedPaneId: model.focusedPaneByPage[model.activePageId],
        scrollByPane: model.scrollByPage[model.activePageId] ?? {},
      };

      const rendered = renderFrameNode(activePage.layout(activePageModel), bodyRect, renderCtx);
      const bodyLines = fitBlock(rendered.output, bodyRect.width, bodyRect.height);
      const rows: string[] = [header, helpLine, ...bodyLines];
      while (rows.length < model.rows) rows.push(' '.repeat(Math.max(0, model.columns)));

      let output = rows.slice(0, model.rows).join('\n');

      const overlays: Overlay[] = [];
      if (options.overlayFactory != null) {
        overlays.push(...options.overlayFactory({
          activePageId: model.activePageId,
          pageModel: activePageModel,
          paneRects: rendered.paneRects,
          screenRect: { row: 0, col: 0, width: model.columns, height: model.rows },
        }));
      }

      if (model.helpOpen) {
        const full = helpView(mergeBindingSources(frameKeys, options.globalKeys, activePage.helpSource ?? activePage.keyMap));
        overlays.push(modal({
          title: 'Keyboard Help',
          body: full.length > 0 ? full : 'No bindings',
          hint: 'Press ? to close',
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (model.commandPalette != null) {
        const paletteWidth = Math.max(20, Math.min(80, model.columns - 4));
        const paletteBody = commandPalette(model.commandPalette, { width: Math.max(16, paletteWidth - 4) });
        overlays.push(modal({
          title: 'Command Palette',
          body: paletteBody,
          hint: 'Enter select • Esc close',
          width: paletteWidth,
          screenWidth: model.columns,
          screenHeight: model.rows,
        }));
      }

      if (overlays.length > 0) {
        output = composite(output, overlays, { dim: true });
      }

      return output;
    },
  };

  return app;
}

function handlePaletteKey<PageModel, Msg>(
  msg: KeyMsg,
  model: InternalFrameModel<PageModel, Msg>,
  paletteKeys: KeyMap<PaletteAction>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
  const cp = model.commandPalette!;
  const action = paletteKeys.handle(msg);

  if (action != null) {
    switch (action.type) {
      case 'cp-next':
        return [{ ...model, commandPalette: cpFocusNext(cp) }, []];
      case 'cp-prev':
        return [{ ...model, commandPalette: cpFocusPrev(cp) }, []];
      case 'cp-page-down':
        return [{ ...model, commandPalette: cpPageDown(cp) }, []];
      case 'cp-page-up':
        return [{ ...model, commandPalette: cpPageUp(cp) }, []];
      case 'cp-close':
        return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined }, []];
      case 'cp-select': {
        const selected = cpSelectedItem(cp);
        if (selected == null) {
          return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined }, []];
        }
        const entry = model.commandPaletteEntries?.find((x) => x.id === selected.id);
        if (entry?.frameAction != null) {
          const closed = { ...model, commandPalette: undefined, commandPaletteEntries: undefined };
          return applyFrameAction(entry.frameAction, closed, frameKeys, options, pagesById);
        }
        if (entry?.msgAction !== undefined) {
          return [{
            ...model,
            commandPalette: undefined,
            commandPaletteEntries: undefined,
          }, [emitMsg(entry.msgAction)]];
        }
        return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined }, []];
      }
    }
  }

  if (msg.key === 'backspace') {
    const next = cpFilter(cp, cp.query.slice(0, -1));
    return [{ ...model, commandPalette: next }, []];
  }

  if (msg.ctrl && msg.key === 'c') {
    return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined }, []];
  }

  if (!msg.ctrl && !msg.alt && !msg.shift && msg.key === 'q' && cp.query.length === 0) {
    return [{ ...model, commandPalette: undefined, commandPaletteEntries: undefined }, []];
  }

  if (!msg.ctrl && !msg.alt && msg.key.length === 1) {
    const next = cpFilter(cp, cp.query + msg.key);
    return [{ ...model, commandPalette: next }, []];
  }

  return [model, []];
}

function applyFrameAction<PageModel, Msg>(
  action: FrameAction,
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
  switch (action.type) {
    case 'toggle-help':
      return [{ ...model, helpOpen: !model.helpOpen }, []];
    case 'prev-tab':
      return [switchTab(model, -1, pagesById), []];
    case 'next-tab':
      return [switchTab(model, 1, pagesById), []];
    case 'next-pane':
      return [cyclePane(model, 1, pagesById), []];
    case 'prev-pane':
      return [cyclePane(model, -1, pagesById), []];
    case 'open-palette':
      if (!options.enableCommandPalette) return [model, []];
      return [openCommandPalette(model, frameKeys, options, pagesById), []];
    case 'scroll-up':
    case 'scroll-down':
    case 'page-up':
    case 'page-down':
    case 'top':
    case 'bottom':
    case 'scroll-left':
    case 'scroll-right':
      return [scrollFocusedPane(model, action, pagesById), []];
  }
}

function switchTab<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const idx = model.pageOrder.indexOf(model.activePageId);
  if (idx < 0) return model;
  const nextIdx = (idx + delta + model.pageOrder.length) % model.pageOrder.length;
  const nextId = model.pageOrder[nextIdx]!;
  return syncPageFrameState({ ...model, activePageId: nextId }, nextId, pagesById);
}

function cyclePane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(model.activePageId)!;
  const paneIds = collectPaneIds(page.layout(model.pageModels[model.activePageId]!));
  if (paneIds.length === 0) return model;

  const curr = model.focusedPaneByPage[model.activePageId];
  const idx = curr == null ? 0 : paneIds.indexOf(curr);
  const nextIdx = idx < 0
    ? 0
    : (idx + delta + paneIds.length) % paneIds.length;
  const next = paneIds[nextIdx]!;
  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [model.activePageId]: next,
    },
  };
}

function scrollFocusedPane<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  action: Extract<
    FrameAction,
    { type: 'scroll-up' | 'scroll-down' | 'page-up' | 'page-down' | 'top' | 'bottom' | 'scroll-left' | 'scroll-right' }
  >,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const bodyRect = frameBodyRect(model.columns, model.rows);
  const resolved = renderFrameNode(page.layout(model.pageModels[pageId]!), bodyRect, {
    model,
    pageId,
    focusedPaneId,
    scrollByPane: model.scrollByPage[pageId] ?? {},
  });
  const paneRect = resolved.paneRects.get(focusedPaneId);
  if (paneRect == null || paneRect.width <= 0 || paneRect.height <= 0) return model;

  const paneNode = findPaneNode(page.layout(model.pageModels[pageId]!), focusedPaneId);
  if (paneNode == null) return model;

  const content = paneNode.render(paneRect.width, paneRect.height);
  let state = createFocusAreaState({
    content,
    width: paneRect.width,
    height: paneRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  const prior = model.scrollByPage[pageId]?.[focusedPaneId] ?? { x: 0, y: 0 };
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);

  switch (action.type) {
    case 'scroll-up':
      state = focusAreaScrollBy(state, -1);
      break;
    case 'scroll-down':
      state = focusAreaScrollBy(state, 1);
      break;
    case 'page-up':
      state = focusAreaPageUp(state);
      break;
    case 'page-down':
      state = focusAreaPageDown(state);
      break;
    case 'top':
      state = focusAreaScrollToTop(state);
      break;
    case 'bottom':
      state = focusAreaScrollToBottom(state);
      break;
    case 'scroll-left':
      state = focusAreaScrollByX(state, -1);
      break;
    case 'scroll-right':
      state = focusAreaScrollByX(state, 1);
      break;
  }

  const pageScroll = model.scrollByPage[pageId] ?? {};
  return {
    ...model,
    scrollByPage: {
      ...model.scrollByPage,
      [pageId]: {
        ...pageScroll,
        [focusedPaneId]: { x: state.scroll.x, y: state.scroll.y },
      },
    },
  };
}

function openCommandPalette<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const entries = buildPaletteEntries(model, frameKeys, options, pagesById);
  const items = entries.map((x) => x.item);
  return {
    ...model,
    commandPalette: createCommandPaletteState(items, Math.max(5, Math.min(10, model.rows - 8))),
    commandPaletteEntries: entries,
  };
}

function buildPaletteEntries<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): readonly PaletteEntry<Msg>[] {
  const entries: PaletteEntry<Msg>[] = [];
  let seq = 0;

  for (const b of frameKeys.bindings()) {
    if (!b.enabled) continue;
    const action = frameKeys.handle(comboToMsg(b));
    if (action === undefined) continue;
    const id = `frame:${seq++}`;
    entries.push({
      id,
      item: {
        id,
        label: b.description,
        category: 'Frame',
        shortcut: formatKeyCombo(b.combo),
      },
      frameAction: action,
    });
  }

  const global = options.globalKeys;
  if (global != null) {
    for (const b of global.bindings()) {
      if (!b.enabled) continue;
      const action = global.handle(comboToMsg(b));
      if (action === undefined) continue;
      const id = `global:${seq++}`;
      entries.push({
        id,
        item: {
          id,
          label: b.description,
          category: 'Global',
          shortcut: formatKeyCombo(b.combo),
        },
        msgAction: action,
      });
    }
  }

  const page = pagesById.get(model.activePageId)!;
  if (page.keyMap != null) {
    for (const b of page.keyMap.bindings()) {
      if (!b.enabled) continue;
      const action = page.keyMap.handle(comboToMsg(b));
      if (action === undefined) continue;
      const id = `page:${seq++}`;
      entries.push({
        id,
        item: {
          id,
          label: b.description,
          category: page.title,
          shortcut: formatKeyCombo(b.combo),
        },
        msgAction: action,
      });
    }
  }

  if (page.commandItems != null) {
    for (const item of page.commandItems(model.pageModels[model.activePageId]!)) {
      const id = `custom:${seq++}`;
      entries.push({
        id,
        item: {
          ...item,
          id,
          category: item.category ?? page.title,
        },
      });
    }
  }

  return entries;
}

function syncPageFrameState<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pageId: string,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(pageId)!;
  const paneIds = collectPaneIds(page.layout(model.pageModels[pageId]!));

  const prevScroll = model.scrollByPage[pageId] ?? {};
  const nextScroll: Record<string, FramePaneScroll> = {};
  for (const paneId of paneIds) {
    nextScroll[paneId] = prevScroll[paneId] ?? { x: 0, y: 0 };
  }

  const prevFocused = model.focusedPaneByPage[pageId];
  const focused = prevFocused != null && paneIds.includes(prevFocused)
    ? prevFocused
    : paneIds[0];

  return {
    ...model,
    focusedPaneByPage: {
      ...model.focusedPaneByPage,
      [pageId]: focused,
    },
    scrollByPage: {
      ...model.scrollByPage,
      [pageId]: nextScroll,
    },
  };
}

function renderFrameNode<PageModel, Msg>(
  node: FrameLayoutNode,
  rect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
): RenderResult {
  if (rect.width <= 0 || rect.height <= 0) {
    return { output: '', paneRects: new Map(), paneOrder: [] };
  }

  if (node.kind === 'pane') {
    const prior = ctx.scrollByPane[node.paneId] ?? { x: 0, y: 0 };
    const content = node.render(rect.width, rect.height);
    let state = createFocusAreaState({
      content,
      width: rect.width,
      height: rect.height,
      overflowX: node.overflowX ?? 'hidden',
    });
    state = focusAreaScrollTo(state, prior.y);
    state = focusAreaScrollToX(state, prior.x);
    const output = focusArea(state, { focused: node.paneId === ctx.focusedPaneId });
    return {
      output,
      paneRects: new Map([[node.paneId, rect]]),
      paneOrder: [node.paneId],
    };
  }

  if (node.kind === 'split') {
    const direction = node.direction ?? 'row';
    const layout = splitPaneLayout(node.state, {
      direction,
      width: rect.width,
      height: rect.height,
      minA: node.minA,
      minB: node.minB,
    });

    const aRect = offsetRect(layout.paneA, rect.row, rect.col);
    const bRect = offsetRect(layout.paneB, rect.row, rect.col);

    const a = renderFrameNode(node.paneA, aRect, ctx);
    const b = renderFrameNode(node.paneB, bRect, ctx);

    const output = splitPane(node.state, {
      direction,
      width: rect.width,
      height: rect.height,
      minA: node.minA,
      minB: node.minB,
      dividerChar: node.dividerChar,
      paneA: () => a.output,
      paneB: () => b.output,
    });

    return {
      output,
      paneRects: mergeMaps(a.paneRects, b.paneRects),
      paneOrder: [...a.paneOrder, ...b.paneOrder],
    };
  }

  const relRects = gridLayout({
    width: rect.width,
    height: rect.height,
    columns: node.columns,
    rows: node.rows,
    areas: node.areas,
    gap: node.gap,
  });

  const renderedByArea = new Map<string, RenderResult>();
  for (const [areaName, areaRect] of relRects) {
    const child = node.cells[areaName];
    if (child == null) {
      throw new Error(`createFramedApp: grid cell "${areaName}" missing in layout node`);
    }
    renderedByArea.set(areaName, renderFrameNode(child, offsetRect(areaRect, rect.row, rect.col), ctx));
  }

  const output = grid({
    width: rect.width,
    height: rect.height,
    columns: node.columns,
    rows: node.rows,
    areas: node.areas,
    gap: node.gap,
    cells: Object.fromEntries([...renderedByArea.entries()].map(([name, rendered]) => [name, () => rendered.output])),
  });

  let paneRects = new Map<string, LayoutRect>();
  const paneOrder: string[] = [];
  for (const rendered of renderedByArea.values()) {
    paneRects = mergeMaps(paneRects, rendered.paneRects);
    paneOrder.push(...rendered.paneOrder);
  }

  return { output, paneRects, paneOrder };
}

function collectPaneIds(node: FrameLayoutNode): string[] {
  if (node.kind === 'pane') return [node.paneId];
  if (node.kind === 'split') return [...collectPaneIds(node.paneA), ...collectPaneIds(node.paneB)];

  const ids: string[] = [];
  for (const name of Object.keys(node.cells)) {
    ids.push(...collectPaneIds(node.cells[name]!));
  }
  return ids;
}

function findPaneNode(node: FrameLayoutNode, paneId: string): Extract<FrameLayoutNode, { kind: 'pane' }> | undefined {
  if (node.kind === 'pane') return node.paneId === paneId ? node : undefined;
  if (node.kind === 'split') return findPaneNode(node.paneA, paneId) ?? findPaneNode(node.paneB, paneId);
  for (const key of Object.keys(node.cells)) {
    const found = findPaneNode(node.cells[key]!, paneId);
    if (found) return found;
  }
  return undefined;
}

function createFrameKeyMap(): KeyMap<FrameAction> {
  return createKeyMap<FrameAction>()
    .group('Frame', (g) => g
      .bind('?', 'Toggle help', { type: 'toggle-help' })
      .bind('[', 'Previous tab', { type: 'prev-tab' })
      .bind(']', 'Next tab', { type: 'next-tab' })
      .bind('tab', 'Next pane', { type: 'next-pane' })
      .bind('shift+tab', 'Previous pane', { type: 'prev-pane' })
      .bind('ctrl+p', 'Open command palette', { type: 'open-palette' })
      .bind(':', 'Open command palette', { type: 'open-palette' }),
    )
    .group('Scroll', (g) => g
      .bind('j', 'Scroll down', { type: 'scroll-down' })
      .bind('k', 'Scroll up', { type: 'scroll-up' })
      .bind('d', 'Page down', { type: 'page-down' })
      .bind('u', 'Page up', { type: 'page-up' })
      .bind('g', 'Top', { type: 'top' })
      .bind('shift+g', 'Bottom', { type: 'bottom' })
      .bind('h', 'Scroll left', { type: 'scroll-left' })
      .bind('l', 'Scroll right', { type: 'scroll-right' }),
    );
}

function renderHeaderLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): string {
  const title = options.title ?? 'App';
  const tabs = model.pageOrder.map((id) => {
    const page = pagesById.get(id)!;
    return id === model.activePageId ? `[${page.title}]` : ` ${page.title} `;
  }).join(' ');

  return fitLine(`${title}  ${tabs}`, model.columns);
}

function renderHelpLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
): string {
  const source = mergeBindingSources(
    frameKeys,
    options.globalKeys,
    activePage.helpSource ?? activePage.keyMap,
  );
  const hint = helpShort(source);
  return fitLine(hint.length > 0 ? ` ${hint}` : '', model.columns);
}

function mergeBindingSources(...sources: Array<BindingSource | undefined>): BindingSource {
  return {
    bindings(): readonly BindingInfo[] {
      const merged: BindingInfo[] = [];
      for (const src of sources) {
        if (src == null) continue;
        merged.push(...src.bindings());
      }
      return merged;
    },
  };
}

function frameBodyRect(columns: number, rows: number): LayoutRect {
  return {
    row: Math.min(2, Math.max(0, rows)),
    col: 0,
    width: Math.max(0, columns),
    height: Math.max(0, rows - 2),
  };
}

function fitBlock(content: string, width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return Array.from({ length: Math.max(0, height) }, () => '');
  const src = content.split('\n');
  const out: string[] = [];
  for (let i = 0; i < height; i++) {
    const line = src[i] ?? '';
    const clipped = clipToWidth(line, width);
    out.push(clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped))));
  }
  return out;
}

function fitLine(line: string, width: number): string {
  const clipped = clipToWidth(line, Math.max(0, width));
  return clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped)));
}

function mergeMaps<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>): Map<K, V> {
  const out = new Map<K, V>();
  for (const [k, v] of a) out.set(k, v);
  for (const [k, v] of b) out.set(k, v);
  return out;
}

function offsetRect(rect: LayoutRect, rowOffset: number, colOffset: number): LayoutRect {
  return {
    row: rowOffset + rect.row,
    col: colOffset + rect.col,
    width: rect.width,
    height: rect.height,
  };
}

function comboToMsg(binding: BindingInfo): KeyMsg {
  return {
    type: 'key',
    key: binding.combo.key,
    ctrl: binding.combo.ctrl,
    alt: binding.combo.alt,
    shift: binding.combo.shift,
  };
}

function emitMsg<Msg>(msg: Msg): Cmd<Msg> {
  return async () => msg;
}
