/**
 * `appFrame()` — high-level TEA app shell.
 *
 * Provides tabs, pane focus/scroll isolation, shell key handling, help,
 * panel-scoped overlay context, and optional frame-level command palette.
 */

import { resolveSafeCtx, type BijouContext } from '@flyingrobots/bijou';
import { helpShort, helpView, type BindingSource } from './help.js';
import {
  createKeyMap,
  formatKeyCombo,
  type BindingInfo,
  type KeyMap,
} from './keybindings.js';
import type { App, Cmd, KeyMsg } from './types.js';
import { isKeyMsg, isMouseMsg, isResizeMsg, QUIT } from './types.js';
import type { Overlay } from './overlay.js';
import { composite, modal } from './overlay.js';
import type { TransitionShaderFn } from './transition-shaders.js';
import { fitBlock } from './layout-utils.js';
import { type BuiltinTransition, TRANSITION_SHADERS } from './transition-shaders.js';
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
import { splitPane, splitPaneLayout, type SplitPaneDirection, type SplitPaneState } from './split-pane.js';
import type { LayoutRect } from './layout-rect.js';
import {
  createPanelVisibilityState,
  createPanelMaximizeState,
  toggleMinimized,
  restorePane,
  isMinimized,
  toggleMaximize,
  type PanelVisibilityState,
  type PanelMaximizeState,
} from './panel-state.js';
import {
  createPanelDockState,
  movePaneInContainer,
  resolveChildOrder,
  findPaneContainer,
  getNodeId,
  type PanelDockState,
  type DockDirection,
} from './panel-dock.js';
import {
  restoreLayoutState,
  type SerializedLayoutState,
} from './layout-preset.js';
import { clipToWidth, tokenizeAnsi, visibleLength } from './viewport.js';
import { EASINGS } from './spring.js';
import { timeline, type Timeline, type TimelineState } from './timeline.js';

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
  /** Optional page-scoped command items for command palette listing/execution. */
  commandItems?: (model: PageModel) => readonly FrameCommandItem<Msg>[];
}

/** Custom command-palette item with optional message dispatch action. */
export interface FrameCommandItem<Msg> extends CommandPaletteItem {
  /** Message dispatched when this item is selected. */
  readonly action?: Msg;
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

/** Page transition styles — a built-in name or a custom shader function. */
export type PageTransition = BuiltinTransition | TransitionShaderFn;

/** `createFramedApp()` options. */
export interface CreateFramedAppOptions<PageModel, Msg> {
  /** Registered pages. */
  readonly pages: readonly FramePage<PageModel, Msg>[];
  /** Optional default page id (falls back to first page). */
  readonly defaultPageId?: string;
  /** Optional frame title. */
  readonly title?: string;
  /** Initial terminal width before runtime resize events. Default: 80. */
  readonly initialColumns?: number;
  /** Initial terminal height before runtime resize events. Default: 24. */
  readonly initialRows?: number;
  /** Optional global keymap layered above page keymap. */
  readonly globalKeys?: KeyMap<Msg>;
  /** Enable frame-level command palette (`ctrl+p` / `:`). */
  readonly enableCommandPalette?: boolean;
  /** Optional overlay provider (receives pane rects for panel scoping). */
  readonly overlayFactory?: (ctx: FrameOverlayContext<PageModel>) => readonly Overlay[];
  /** Optional page transition style. Default: 'none'. */
  readonly transition?: PageTransition;
  /** Transition duration in milliseconds. Default: 300. */
  readonly transitionDuration?: number;
  /** Optional function to determine the transition style dynamically. */
  readonly transitionOverride?: (model: PageModel) => PageTransition;
  /**
   * Optional compiled timeline that drives the transition animation.
   *
   * Must contain a `'progress'` track that tweens from 0 to 1.
   * When provided, replaces the default ease/duration with whatever
   * the timeline defines — springs, multi-track orchestration, etc.
   *
   * ```ts
   * import { timeline, EASINGS } from '@flyingrobots/bijou-tui';
   *
   * createFramedApp({
   *   transition: 'melt',
   *   transitionTimeline: timeline()
   *     .add('progress', {
   *       type: 'tween',
   *       from: 0, to: 1,
   *       duration: 600,
   *       ease: EASINGS.easeInOutCubic,
   *     })
   *     .build(),
   * });
   * ```
   */
  readonly transitionTimeline?: Timeline;
  /** Optional initial layout state to restore on startup. */
  readonly initialLayout?: SerializedLayoutState;
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
  /** ID of the page we are transitioning away from. */
  readonly previousPageId?: string;
  /** Transition progress (0 to 1). */
  readonly transitionProgress: number;
  /** Monotonic counter to discard stale transition ticks. */
  readonly transitionGeneration: number;
  /** Currently active transition style. */
  readonly activeTransition?: PageTransition;
  /** Wall-clock start time of the active transition (ms since epoch). */
  readonly transitionStartMs?: number;
  /** Compiled timeline driving the active transition. */
  readonly transitionTimeline?: Timeline;
  /** Timeline state for the active transition. */
  readonly transitionTimelineState?: TimelineState;
  /** Per-page panel visibility (minimize/fold) state. */
  readonly minimizedByPage: Readonly<Record<string, PanelVisibilityState>>;
  /** Per-page maximized pane state. */
  readonly maximizedPaneByPage: Readonly<Record<string, PanelMaximizeState>>;
  /** Per-page dock order state. */
  readonly dockStateByPage: Readonly<Record<string, PanelDockState>>;
  /** Per-page split ratio overrides (from layout presets/session restore). */
  readonly splitRatioOverrides: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

/** Internal model extending the public FrameModel with palette entries. */
interface InternalFrameModel<PageModel, Msg> extends FrameModel<PageModel> {
  readonly commandPaletteEntries?: readonly PaletteEntry<Msg>[];
}

/** A command palette entry linking a UI item to an action or message. */
interface PaletteEntry<Msg> {
  readonly id: string;
  readonly item: CommandPaletteItem;
  readonly msgAction?: Msg;
  readonly targetPageId?: string;
  readonly frameAction?: FrameAction;
}

/** Per-call context passed through the recursive layout renderer. */
interface RenderContext<PageModel, Msg> {
  readonly model: InternalFrameModel<PageModel, Msg>;
  readonly pageId: string;
  readonly focusedPaneId: string | undefined;
  readonly scrollByPane: Readonly<Record<string, FramePaneScroll>>;
  readonly visibility: PanelVisibilityState;
  readonly dockState: PanelDockState;
}

/** Output of a layout node render pass. */
interface RenderResult {
  readonly output: string;
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

/** Discriminated union of all frame-level actions (tabs, panes, scroll, palette, help, transitions). */
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
  | { type: 'open-palette' }
  | { type: 'toggle-minimize' }
  | { type: 'toggle-maximize' }
  | { type: 'dock-up' }
  | { type: 'dock-down' }
  | { type: 'dock-left' }
  | { type: 'dock-right' }
  | { type: 'transition'; progress: number; generation: number }
  | { type: 'transition-complete'; generation: number };

/** Discriminated union of command palette navigation/selection actions. */
type PaletteAction =
  | { type: 'cp-next' }
  | { type: 'cp-prev' }
  | { type: 'cp-page-down' }
  | { type: 'cp-page-up' }
  | { type: 'cp-select' }
  | { type: 'cp-close' };

const PAGE_MSG_TOKEN = Symbol('app-frame-page-msg');
const FRAME_MSG_TOKEN = Symbol('app-frame-frame-msg');

/** Wrapper that tags a user message with its originating page ID. */
interface PageScopedMsg<Msg> {
  readonly [PAGE_MSG_TOKEN]: true;
  readonly pageId: string;
  readonly msg: Msg;
}

/** Wrapper that tags a frame-internal action for the update loop. */
interface FrameScopedMsg {
  readonly [FRAME_MSG_TOKEN]: true;
  readonly action: FrameAction;
}

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
        initCmds.push(...cmds.map((cmd) => wrapCmdForPage(page.id, cmd)));
      }

      let model: InternalFrameModel<PageModel, Msg> = {
        activePageId: defaultPageId,
        pageOrder,
        pageModels,
        focusedPaneByPage: {},
        scrollByPage: {},
        columns: Math.max(1, options.initialColumns ?? 80),
        rows: Math.max(1, options.initialRows ?? 24),
        helpOpen: false,
        transitionProgress: 1,
        transitionGeneration: 0,
        minimizedByPage: {},
        maximizedPaneByPage: {},
        dockStateByPage: {},
        splitRatioOverrides: {},
      };

      for (const pageId of pageOrder) {
        model = syncPageFrameState(model, pageId, pagesById);
      }

      // Apply initial layout if provided
      if (options.initialLayout) {
        const restored = restoreLayoutState(options.initialLayout);
        model = {
          ...model,
          activePageId: pagesById.has(restored.activePageId) ? restored.activePageId : model.activePageId,
          focusedPaneByPage: { ...model.focusedPaneByPage, ...restored.focusedPaneByPage },
          minimizedByPage: restored.minimizedByPage,
          maximizedPaneByPage: restored.maximizedPaneByPage,
          dockStateByPage: restored.dockStateByPage,
          splitRatioOverrides: restored.splitRatiosByPage,
        };
      }

      return [model, initCmds];
    },

    update(msg, model) {
      if (isFrameScopedMsg(msg)) {
        const action = msg.action;
        if (action.type === 'transition') {
          // Ignore stale transition ticks from a previous generation
          if (action.generation !== model.transitionGeneration) return [model, []];
          // Advance timeline using wall-clock elapsed time
          if (model.transitionTimeline && model.transitionTimelineState && model.transitionStartMs != null) {
            const elapsedMs = Date.now() - model.transitionStartMs;
            const elapsedSec = Math.max(0, elapsedMs / 1000);
            // Step from init to current elapsed time (tweens are deterministic)
            const state = model.transitionTimeline.step(model.transitionTimeline.init(), elapsedSec);
            const vals = model.transitionTimeline.values(state);
            const progress = Math.min(1, Math.max(0, vals['progress'] ?? action.progress));

            if (model.transitionTimeline.done(state) || progress >= 1) {
              return [{
                ...model,
                transitionProgress: 1,
                previousPageId: undefined,
                activeTransition: undefined,
                transitionStartMs: undefined,
                transitionTimeline: undefined,
                transitionTimelineState: undefined,
              }, []];
            }

            return [{
              ...model,
              transitionProgress: progress,
              transitionTimelineState: state,
            }, []];
          }
          // Fallback for non-timeline transitions (backward compat)
          return [{ ...model, transitionProgress: action.progress }, []];
        }
        if (action.type === 'transition-complete') {
          if (action.generation !== model.transitionGeneration) return [model, []];
          return [{
            ...model,
            transitionProgress: 1,
            previousPageId: undefined,
            activeTransition: undefined,
            transitionStartMs: undefined,
            transitionTimeline: undefined,
            transitionTimelineState: undefined,
          }, []];
        }
        return applyFrameAction(action, model, frameKeys, options, pagesById);
      }

      if (isResizeMsg(msg)) {
        return [{
          ...model,
          columns: msg.columns,
          rows: msg.rows,
        }, []];
      }

      if (isKeyMsg(msg)) {
        if (model.commandPalette != null) {
          return handlePaletteKey(msg, model, paletteKeys, frameKeys, options, pagesById);
        }

        // Help acts as a modal layer when open: only close keys are handled.
        if (model.helpOpen) {
          if (!msg.ctrl && !msg.alt && (msg.key === 'escape' || msg.key === '?')) {
            return [{ ...model, helpOpen: false }, []];
          }
          return [model, []];
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
          return [model, [emitMsgForPage(model.activePageId, pageAction)]];
        }

        return [model, []];
      }

      if (isMouseMsg(msg)) {
        return [model, []];
      }

      // Custom message path: route to originating page when command messages are scoped.
      const scoped = isPageScopedMsg<Msg>(msg) ? msg : undefined;
      const targetPageId = scoped?.pageId ?? model.activePageId;
      const targetPage = pagesById.get(targetPageId);
      if (targetPage == null) return [model, []];

      const targetMsg = scoped?.msg ?? (msg as Msg);
      const pageModel = model.pageModels[targetPageId]!;
      const [nextPageModel, cmds] = targetPage.update(targetMsg, pageModel);
      const nextModels = { ...model.pageModels, [targetPageId]: nextPageModel };
      const synced = syncPageFrameState({ ...model, pageModels: nextModels }, targetPageId, pagesById);
      return [synced, cmds.map((cmd) => wrapCmdForPage(targetPageId, cmd))];
    },

    view(model) {
      const activePage = pagesById.get(model.activePageId)!;
      const header = renderHeaderLine(model, options, pagesById);
      const helpLine = renderHelpLine(model, frameKeys, options, activePage);
      const bodyRect = frameBodyRect(model.columns, model.rows);

      // Check for maximized pane — if set, render only that pane at full body rect
      const maxState = model.maximizedPaneByPage[model.activePageId];
      const maximizedPaneId = maxState?.maximizedPaneId;

      const activeResult = maximizedPaneId
        ? renderMaximizedPane(model.activePageId, model, bodyRect, pagesById, maximizedPaneId)
        : renderPageContent(model.activePageId, model, bodyRect, pagesById);
      let bodyOutput = activeResult.output;

      const activeTransition = model.activeTransition ?? options.transition;
      if (model.previousPageId != null && model.transitionProgress < 1 && activeTransition && activeTransition !== 'none') {
        const ctx = resolveSafeCtx();
        if (ctx) {
          const prevResult = renderPageContent(model.previousPageId, model, bodyRect, pagesById);
          bodyOutput = renderTransition(
            prevResult.output,
            activeResult.output,
            activeTransition,
            model.transitionProgress,
            bodyRect.width,
            bodyRect.height,
            ctx,
          );
        }
      }

      const bodyLines = fitBlock(bodyOutput, bodyRect.width, bodyRect.height);
      const rows: string[] = [header, helpLine, ...bodyLines];
      while (rows.length < model.rows) rows.push(' '.repeat(Math.max(0, model.columns)));

      let output = rows.slice(0, model.rows).join('\n');

      const overlays: Overlay[] = [];
      if (options.overlayFactory != null) {
        overlays.push(...options.overlayFactory({
          activePageId: model.activePageId,
          pageModel: model.pageModels[model.activePageId]!,
          paneRects: activeResult.paneRects,
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

/** Route a key press through the command palette, returning updated model and commands. */
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
          const cmd = entry.targetPageId != null
            ? emitMsgForPage(entry.targetPageId, entry.msgAction)
            : emitMsg(entry.msgAction);
          return [{
            ...model,
            commandPalette: undefined,
            commandPaletteEntries: undefined,
          }, [cmd]];
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

/** Dispatch a frame-level action (tab switch, pane cycle, scroll, palette, help toggle, transitions). */
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
      return switchTab(model, -1, pagesById, options);
    case 'next-tab':
      return switchTab(model, 1, pagesById, options);
    case 'next-pane':
      return [cyclePane(model, 1, pagesById), []];
    case 'prev-pane':
      return [cyclePane(model, -1, pagesById), []];
    case 'open-palette':
      if (!options.enableCommandPalette) return [model, []];
      return [openCommandPalette(model, frameKeys, options, pagesById), []];
    case 'toggle-minimize':
      return [applyToggleMinimize(model, pagesById), []];
    case 'toggle-maximize':
      return [applyToggleMaximize(model, pagesById), []];
    case 'dock-up':
    case 'dock-down':
    case 'dock-left':
    case 'dock-right': {
      const dir = action.type.replace('dock-', '') as DockDirection;
      return [applyDockMove(model, dir, pagesById), []];
    }
    case 'scroll-up':
    case 'scroll-down':
    case 'page-up':
    case 'page-down':
    case 'top':
    case 'bottom':
    case 'scroll-left':
    case 'scroll-right':
      return [scrollFocusedPane(model, action, pagesById), []];
    case 'transition':
    case 'transition-complete':
      return [model, []];
  }
}

/** Cycle the active tab by `delta` positions, optionally starting a transition. */
function switchTab<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  delta: number,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  options: CreateFramedAppOptions<PageModel, Msg>,
): [InternalFrameModel<PageModel, Msg>, Cmd<Msg>[]] {
  const idx = model.pageOrder.indexOf(model.activePageId);
  if (idx < 0) return [model, []];
  const nextIdx = (idx + delta + model.pageOrder.length) % model.pageOrder.length;
  const nextId = model.pageOrder[nextIdx]!;

  if (nextId === model.activePageId) return [model, []];

  const activePageModel = model.pageModels[model.activePageId]!;
  const activeTransition = options.transitionOverride
    ? options.transitionOverride(activePageModel)
    : options.transition;

  const hasTransition = activeTransition != null && activeTransition !== 'none';
  const nextGeneration = model.transitionGeneration + 1;

  // Use the user-supplied timeline if provided, otherwise build a default.
  // The timeline MUST contain a 'progress' track (0 → 1).
  const tl = hasTransition
    ? (options.transitionTimeline ?? timeline()
      .add('progress', {
        type: 'tween',
        from: 0,
        to: 1,
        duration: options.transitionDuration ?? 300,
        ease: EASINGS.easeInOutCubic,
      })
      .build())
    : undefined;

  const durationMs = tl?.estimatedDurationMs ?? options.transitionDuration ?? 300;

  const nextModel = syncPageFrameState({
    ...model,
    activePageId: nextId,
    previousPageId: model.activePageId,
    activeTransition,
    transitionProgress: hasTransition ? 0 : 1,
    transitionGeneration: nextGeneration,
    transitionStartMs: hasTransition ? Date.now() : undefined,
    transitionTimeline: tl,
    transitionTimelineState: tl?.init(),
  }, nextId, pagesById);

  if (hasTransition) {
    // Schedule render ticks at ~60fps for the duration of the transition.
    // Each tick advances the timeline using wall-clock elapsed time.
    const cmd: Cmd<Msg> = createTransitionTickCmd(durationMs, nextGeneration);
    return [nextModel, [cmd]];
  }

  return [nextModel, []];
}

/** Move focus to the next or previous pane in the active page's layout. */
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

/** Apply a scroll action to the currently focused pane. */
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
  const layoutTree = page.layout(model.pageModels[pageId]!);
  const bodyRect = frameBodyRect(model.columns, model.rows);
  const resolved = renderFrameNode(layoutTree, bodyRect, {
    model,
    pageId,
    focusedPaneId,
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
  });
  const paneRect = resolved.paneRects.get(focusedPaneId);
  if (paneRect == null || paneRect.width <= 0 || paneRect.height <= 0) return model;

  const paneNode = findPaneNode(layoutTree, focusedPaneId);
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

/** Initialize the command palette with entries from frame, global, page key maps, and custom page command items. */
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

/** Collect all available commands from frame, global, page, and custom sources. */
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
        targetPageId: model.activePageId,
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
        msgAction: item.action,
        targetPageId: model.activePageId,
      });
    }
  }

  return entries;
}

/** Reconcile pane IDs, scroll offsets, and focus for a page after init, tab switches, or window resizes. */
function syncPageFrameState<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pageId: string,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const page = pagesById.get(pageId)!;
  const paneIds = collectPaneIds(page.layout(model.pageModels[pageId]!));
  assertUniquePaneIds(paneIds, `page "${pageId}" layout`);

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

/** Recursively render a layout tree node (pane, split, or grid) into a rect. */
function renderFrameNode<PageModel, Msg>(
  node: FrameLayoutNode,
  rect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
): RenderResult {
  if (rect.width <= 0 || rect.height <= 0) {
    return { output: '', paneRects: new Map(), paneOrder: [] };
  }

  if (node.kind === 'pane') {
    // Minimized pane: render as collapsed title bar
    if (isMinimized(ctx.visibility, node.paneId)) {
      const titleBar = `[${node.paneId}] \u25b8`; // ▸
      const output = fitBlock(titleBar, rect.width, rect.height).join('\n');
      return {
        output,
        paneRects: new Map([[node.paneId, rect]]),
        paneOrder: [node.paneId],
      };
    }

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

    // Consult dock state for child order
    const defaultChildIds = [getNodeId(node.paneA), getNodeId(node.paneB)];
    const resolvedOrder = resolveChildOrder(ctx.dockState, node.splitId, defaultChildIds);
    const swapped = resolvedOrder[0] !== defaultChildIds[0];
    const effectiveA = swapped ? node.paneB : node.paneA;
    const effectiveB = swapped ? node.paneA : node.paneB;

    // Check for minimized panes — give minimized pane 1 row, sibling gets rest
    const aMinimized = isPaneMinimized(effectiveA, ctx.visibility);
    const bMinimized = isPaneMinimized(effectiveB, ctx.visibility);

    let splitState = node.state;
    // Apply split ratio overrides from layout presets
    const ratioOverride = ctx.model.splitRatioOverrides[ctx.pageId]?.[node.splitId];
    if (ratioOverride !== undefined) {
      splitState = { ...splitState, ratio: ratioOverride };
    }

    if (aMinimized && !bMinimized) {
      // A is minimized: give it minimal space
      const mainAxisTotal = direction === 'row' ? rect.width : rect.height;
      const minimizedSize = Math.min(1, mainAxisTotal);
      splitState = { ...splitState, ratio: minimizedSize / Math.max(1, mainAxisTotal) };
    } else if (bMinimized && !aMinimized) {
      // B is minimized: give A most of the space
      const mainAxisTotal = direction === 'row' ? rect.width : rect.height;
      const minimizedSize = Math.min(1, mainAxisTotal);
      splitState = { ...splitState, ratio: 1 - minimizedSize / Math.max(1, mainAxisTotal) };
    }

    const layout = splitPaneLayout(splitState, {
      direction,
      width: rect.width,
      height: rect.height,
      minA: node.minA,
      minB: node.minB,
    });

    const aRect = offsetRect(layout.paneA, rect.row, rect.col);
    const bRect = offsetRect(layout.paneB, rect.row, rect.col);

    const a = renderFrameNode(effectiveA, aRect, ctx);
    const b = renderFrameNode(effectiveB, bRect, ctx);

    const output = splitPane(splitState, {
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
    const absoluteAreaRect = offsetRect(areaRect, rect.row, rect.col);
    const child = node.cells[areaName];
    if (child == null) {
      resolveSafeCtx()?.io.writeError(
        `createFramedApp: grid cell "${areaName}" missing in page "${ctx.pageId}" — rendering placeholder\n`,
      );
      renderedByArea.set(areaName, renderMissingGridCell(areaName, absoluteAreaRect));
      continue;
    }
    renderedByArea.set(areaName, renderFrameNode(child, absoluteAreaRect, ctx));
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
  const seenPaneIds = new Set<string>();
  const paneOrder: string[] = [];
  for (const rendered of renderedByArea.values()) {
    for (const [paneId, paneRect] of rendered.paneRects.entries()) {
      if (paneRects.has(paneId)) {
        throw new Error(`createFramedApp: duplicate paneId "${paneId}" in rendered layout`);
      }
      paneRects.set(paneId, paneRect);
    }
    for (const paneId of rendered.paneOrder) {
      if (seenPaneIds.has(paneId)) {
        throw new Error(`createFramedApp: duplicate paneId "${paneId}" in rendered pane order`);
      }
      seenPaneIds.add(paneId);
      paneOrder.push(paneId);
    }
  }

  return { output, paneRects, paneOrder };
}

/** Render a placeholder for a grid area that has no matching cell definition. */
function renderMissingGridCell(areaName: string, rect: LayoutRect): RenderResult {
  return {
    output: fitBlock(`[missing grid cell: ${areaName}]`, rect.width, rect.height).join('\n'),
    paneRects: new Map(),
    paneOrder: [],
  };
}

/** Recursively collect all pane IDs from a layout tree in declaration order. */
function collectPaneIds(node: FrameLayoutNode): string[] {
  if (node.kind === 'pane') return [node.paneId];
  if (node.kind === 'split') return [...collectPaneIds(node.paneA), ...collectPaneIds(node.paneB)];

  const ids: string[] = [];
  for (const areaName of declaredAreaNames(node.areas)) {
    const child = node.cells[areaName];
    if (child == null) continue;
    ids.push(...collectPaneIds(child));
  }
  return ids;
}

/** Extract unique area names from CSS-grid-style template strings. */
function declaredAreaNames(areas: readonly string[]): string[] {
  const names = new Set<string>();
  for (const row of areas) {
    for (const token of row.trim().split(/\s+/)) {
      if (token !== '' && token !== '.') names.add(token);
    }
  }
  return [...names];
}

/** Throw if any pane ID appears more than once in the given list. */
function assertUniquePaneIds(paneIds: readonly string[], scope: string): void {
  const seen = new Set<string>();
  for (const paneId of paneIds) {
    if (seen.has(paneId)) {
      throw new Error(`createFramedApp: duplicate paneId "${paneId}" in ${scope}`);
    }
    seen.add(paneId);
  }
}

/** Toggle minimize on the focused pane of the active page. */
function applyToggleMinimize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const allPaneIds = collectPaneIds(page.layout(model.pageModels[pageId]!));
  const current = model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  const next = toggleMinimized(current, focusedPaneId, allPaneIds);

  // If we just minimized the focused pane, move focus to a non-minimized sibling
  let newFocused = focusedPaneId;
  if (isMinimized(next, focusedPaneId)) {
    const visible = allPaneIds.filter((id) => !isMinimized(next, id));
    newFocused = visible[0] ?? focusedPaneId;
  }

  return {
    ...model,
    minimizedByPage: { ...model.minimizedByPage, [pageId]: next },
    focusedPaneByPage: { ...model.focusedPaneByPage, [pageId]: newFocused },
  };
}

/** Toggle maximize on the focused pane of the active page. */
function applyToggleMaximize<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  _pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const current = model.maximizedPaneByPage[pageId] ?? createPanelMaximizeState();
  const next = toggleMaximize(current, focusedPaneId);

  // If maximizing a minimized pane, restore it first
  let visibility = model.minimizedByPage[pageId] ?? createPanelVisibilityState();
  if (next.maximizedPaneId && isMinimized(visibility, next.maximizedPaneId)) {
    visibility = restorePane(visibility, next.maximizedPaneId);
  }

  return {
    ...model,
    maximizedPaneByPage: { ...model.maximizedPaneByPage, [pageId]: next },
    minimizedByPage: { ...model.minimizedByPage, [pageId]: visibility },
  };
}

/** Move the focused pane within its container in the given direction. */
function applyDockMove<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  direction: DockDirection,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): InternalFrameModel<PageModel, Msg> {
  const pageId = model.activePageId;
  const focusedPaneId = model.focusedPaneByPage[pageId];
  if (focusedPaneId == null) return model;

  const page = pagesById.get(pageId)!;
  const layoutTree = page.layout(model.pageModels[pageId]!);
  const container = findPaneContainer(layoutTree, focusedPaneId);
  if (container == null) return model;

  const dockState = model.dockStateByPage[pageId] ?? createPanelDockState();
  const currentOrder = resolveChildOrder(dockState, container.containerId, container.childIds);
  const next = movePaneInContainer(dockState, container.containerId, focusedPaneId, direction, currentOrder);

  return {
    ...model,
    dockStateByPage: { ...model.dockStateByPage, [pageId]: next },
  };
}

/** Render only the maximized pane at the full body rect. */
function renderMaximizedPane<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
): RenderResult {
  const page = pagesById.get(pageId)!;
  const pageModel = model.pageModels[pageId]!;
  const layoutTree = page.layout(pageModel);
  const paneNode = findPaneNode(layoutTree, maximizedPaneId);
  if (paneNode == null) {
    // Pane not found, fall back to normal rendering
    return renderPageContent(pageId, model, bodyRect, pagesById);
  }

  const prior = model.scrollByPage[pageId]?.[maximizedPaneId] ?? { x: 0, y: 0 };
  const content = paneNode.render(bodyRect.width, bodyRect.height);
  let state = createFocusAreaState({
    content,
    width: bodyRect.width,
    height: bodyRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  const output = focusArea(state, { focused: true });

  return {
    output,
    paneRects: new Map([[maximizedPaneId, bodyRect]]),
    paneOrder: [maximizedPaneId],
  };
}

/** Walk the layout tree to find the pane node with the given ID. */
function findPaneNode(node: FrameLayoutNode, paneId: string): Extract<FrameLayoutNode, { kind: 'pane' }> | undefined {
  if (node.kind === 'pane') return node.paneId === paneId ? node : undefined;
  if (node.kind === 'split') return findPaneNode(node.paneA, paneId) ?? findPaneNode(node.paneB, paneId);
  for (const key of Object.keys(node.cells)) {
    const found = findPaneNode(node.cells[key]!, paneId);
    if (found) return found;
  }
  return undefined;
}

/** Build the default key map for frame-level actions (tabs, panes, scroll, help '?', command palette 'ctrl+p'/':'). */
function createFrameKeyMap(): KeyMap<FrameAction> {
  return createKeyMap<FrameAction>()
    .group('Frame', (g) => g
      .bind('?', 'Toggle help', { type: 'toggle-help' })
      .bind('[', 'Previous tab', { type: 'prev-tab' })
      .bind(']', 'Next tab', { type: 'next-tab' })
      .bind('tab', 'Next pane', { type: 'next-pane' })
      .bind('shift+tab', 'Previous pane', { type: 'prev-pane' })
      .bind('ctrl+p', 'Open command palette', { type: 'open-palette' })
      .bind(':', 'Open command palette', { type: 'open-palette' })
      .bind('ctrl+m', 'Fold/unfold pane', { type: 'toggle-minimize' })
      .bind('ctrl+f', 'Full-screen pane', { type: 'toggle-maximize' }),
    )
    .group('Dock', (g) => g
      .bind('ctrl+shift+up', 'Move pane up', { type: 'dock-up' })
      .bind('ctrl+shift+down', 'Move pane down', { type: 'dock-down' })
      .bind('ctrl+shift+left', 'Move pane left', { type: 'dock-left' })
      .bind('ctrl+shift+right', 'Move pane right', { type: 'dock-right' }),
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

/** Render the top header line showing the app title and tab bar. */
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

/** Render the bottom status line showing mode, focused pane, and key hints. */
function renderHelpLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
): string {
  const mode = model.commandPalette != null
    ? 'PALETTE'
    : model.helpOpen
      ? 'HELP'
      : 'NORMAL';
  const focusedPane = model.focusedPaneByPage[model.activePageId] ?? '-';
  const status = `[${mode}] page:${model.activePageId} pane:${focusedPane}`;

  const source = mergeBindingSources(
    frameKeys,
    options.globalKeys,
    activePage.helpSource ?? activePage.keyMap,
  );
  const hint = helpShort(source);
  const line = hint.length > 0
    ? ` ${status}  ${hint}`
    : ` ${status}`;
  return fitLine(line, model.columns);
}

/** Combine multiple binding sources into a single source for help display. */
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

/** Compute the available rect for page content (screen minus header and footer). */
function frameBodyRect(columns: number, rows: number): LayoutRect {
  return {
    row: Math.min(2, Math.max(0, rows)),
    col: 0,
    width: Math.max(0, columns),
    height: Math.max(0, rows - 2),
  };
}


/** Clip or pad a single line to exactly `width` visible columns. */
function fitLine(line: string, width: number): string {
  const clipped = clipToWidth(line, Math.max(0, width));
  return clipped + ' '.repeat(Math.max(0, width - visibleLength(clipped)));
}


/** Check if a layout node (or its first descendant pane) is minimized. */
function isPaneMinimized(node: FrameLayoutNode, visibility: PanelVisibilityState): boolean {
  if (node.kind === 'pane') return isMinimized(visibility, node.paneId);
  // For containers, check if all descendant panes are minimized
  const paneIds = collectPaneIds(node);
  return paneIds.length > 0 && paneIds.every((id) => isMinimized(visibility, id));
}

/** Merge two read-only maps into a new mutable map. */
function mergeMaps<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>): Map<K, V> {
  const out = new Map<K, V>();
  for (const [k, v] of a) out.set(k, v);
  for (const [k, v] of b) out.set(k, v);
  return out;
}

/** Translate a layout rect by the given row and column offsets. */
function offsetRect(rect: LayoutRect, rowOffset: number, colOffset: number): LayoutRect {
  return {
    row: rowOffset + rect.row,
    col: colOffset + rect.col,
    width: rect.width,
    height: rect.height,
  };
}

/** Convert a binding's key combo into a synthetic KeyMsg for dispatch. */
function comboToMsg(binding: BindingInfo): KeyMsg {
  return {
    type: 'key',
    key: binding.combo.key,
    ctrl: binding.combo.ctrl,
    alt: binding.combo.alt,
    shift: binding.combo.shift,
  };
}

/** Type guard: is this message a frame-internal action wrapper? */
function isFrameScopedMsg(value: unknown): value is FrameScopedMsg {
  return typeof value === 'object'
    && value !== null
    && FRAME_MSG_TOKEN in value
    && (value as FrameScopedMsg)[FRAME_MSG_TOKEN] === true;
}

/** Wrap a frame action into a FrameScopedMsg for the update loop. */
function wrapFrameMsg(action: FrameAction): FrameScopedMsg {
  return {
    [FRAME_MSG_TOKEN]: true,
    action,
  };
}

/** Create a command that immediately resolves with the given message. */
function emitMsg<Msg>(msg: Msg): Cmd<Msg> {
  return () => Promise.resolve(msg);
}

/** Create a command that emits a page-scoped message. */
function emitMsgForPage<Msg>(pageId: string, msg: Msg): Cmd<Msg> {
  return async () => wrapPageMsg(pageId, msg);
}

/** Wrap a page-level command so its emitted messages are tagged with the page ID. */
function wrapCmdForPage<Msg>(pageId: string, cmd: Cmd<Msg>): Cmd<Msg> {
  return async (emit) => {
    const result = await cmd((msg) => emit(wrapPageMsg(pageId, msg) as unknown as Msg));
    if (result === undefined || result === QUIT) return result;
    return wrapPageMsg(pageId, result as Msg);
  };
}

/** Tag a user message with its originating page ID. */
function wrapPageMsg<Msg>(pageId: string, msg: Msg): Msg {
  return {
    [PAGE_MSG_TOKEN]: true,
    pageId,
    msg,
  } as unknown as Msg;
}

/** Type guard: is this message a page-scoped wrapper? */
function isPageScopedMsg<Msg>(value: unknown): value is PageScopedMsg<Msg> {
  return typeof value === 'object'
    && value !== null
    && PAGE_MSG_TOKEN in value
    && (value as PageScopedMsg<Msg>)[PAGE_MSG_TOKEN] === true;
}

/**
 * Create a TEA command that drives transition re-renders via `setInterval`.
 *
 * Each tick emits a frame-scoped 'transition' message. The actual progress
 * is computed from wall-clock time in the update handler, not from the
 * interval count. The interval just schedules re-renders.
 */
function createTransitionTickCmd<Msg>(durationMs: number, generation: number): Cmd<Msg> {
  return (emit) =>
    new Promise<void>((resolve) => {
      if (durationMs <= 0) {
        emit(wrapFrameMsg({ type: 'transition-complete', generation } as FrameAction) as unknown as Msg);
        resolve();
        return;
      }

      const startMs = Date.now();
      const intervalMs = Math.round(1000 / 60);

      const id = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const rawProgress = Math.min(1, elapsed / durationMs);

        emit(wrapFrameMsg({ type: 'transition', progress: rawProgress, generation } as FrameAction) as unknown as Msg);

        if (rawProgress >= 1) {
          clearInterval(id);
          emit(wrapFrameMsg({ type: 'transition-complete', generation } as FrameAction) as unknown as Msg);
          resolve();
        }
      }, intervalMs);
    });
}

/** Render a page's layout tree within the frame body rect. */
function renderPageContent<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): RenderResult {
  const page = pagesById.get(pageId)!;
  const pageModel = model.pageModels[pageId]!;
  const renderCtx: RenderContext<PageModel, Msg> = {
    model,
    pageId,
    focusedPaneId: model.focusedPaneByPage[pageId],
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
  };
  return renderFrameNode(page.layout(pageModel), bodyRect, renderCtx);
}

/**
 * Split a styled multiline string into a 2D grid of single-column characters.
 * Each cell is a fully-styled string (including resets).
 */
function stringToGrid(str: string, width: number, height: number): string[][] {
  const lines = str.split('\n');
  const grid: string[][] = [];

  for (let y = 0; y < height; y++) {
    const line = lines[y] ?? '';
    grid.push(tokenizeAnsi(line, width));
  }
  return grid;
}

/** Apply a transition shader to blend between the previous and next page views. */
function renderTransition(
  prev: string,
  next: string,
  style: PageTransition,
  progress: number,
  width: number,
  height: number,
  ctx: BijouContext,
): string {
  const shader = typeof style === 'function' ? style : TRANSITION_SHADERS[style];
  if (!shader) return next;

  const prevGrid = stringToGrid(prev, width, height);
  const nextGrid = stringToGrid(next, width, height);
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      // Shared stable-ish pseudo-random seed based on coordinates
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const rand = seed - Math.floor(seed);

      const result = shader({ x, y, width, height, progress, rand, ctx });
      const showNext = result.showNext;
      const charOverride = result.char;

      if (charOverride !== undefined) {
        line += charOverride;
      } else {
        line += (showNext ? nextGrid[y]?.[x] : prevGrid[y]?.[x]) ?? ' ';
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}
