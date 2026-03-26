/**
 * Layout rendering for `app-frame.ts`.
 *
 * Recursive tree renderer, page content, maximized pane, header/help lines,
 * transition shader, and surface/string bridge helpers.
 */

import {
  createSurface,
  parseAnsiToSurface,
  type Cell,
  resolveSafeCtx,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import type { FrameLayoutNode, FramePage, CreateFramedAppOptions } from './app-frame.js';
import type { InternalFrameModel, RenderContext, RenderResult, FrameAction } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import type { PageTransition } from './app-frame.js';
import { TRANSITION_SHADERS, type TransitionResult } from './transition-shaders.js';
import { fitBlock } from './layout-utils.js';
import { splitPaneLayout } from './split-pane.js';
import { gridLayout } from './grid.js';
import {
  createFocusAreaStateForSurface,
  focusAreaSurfaceInto,
  focusAreaScrollTo,
  focusAreaScrollToX,
} from './focus-area.js';
import { isMinimized, createPanelVisibilityState } from './panel-state.js';
import { createPanelDockState, resolveChildOrder, getNodeId } from './panel-dock.js';
import { visibleLength } from './viewport.js';
import { helpShort } from './help.js';
import type { KeyMap } from './keybindings.js';
import {
  findPaneNode,
  isPaneMinimized,
  mergeMaps,
  offsetRect,
  fitLine,
  mergeBindingSources,
} from './app-frame-utils.js';
import { normalizeViewOutput, normalizeViewOutputInto, type ViewOutput } from './view-output.js';
import { createStyledTextSurfaceWithBCSS } from './css/text-style.js';

export interface FrameHeaderTabTarget {
  readonly pageId: string;
  readonly startCol: number;
  readonly endCol: number;
}

export interface FrameHeaderRenderResult {
  readonly surface: Surface;
  readonly tabTargets: readonly FrameHeaderTabTarget[];
}

const framePaneScratchBySize = new Map<string, Surface>();

interface PaintedFrameNodeResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

export interface FramePaneGeometryResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

/** Recursively render a layout tree node (pane, split, or grid) into a rect. */
export function renderFrameNode<PageModel, Msg>(
  node: FrameLayoutNode,
  rect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
): RenderResult {
  if (rect.width <= 0 || rect.height <= 0) {
    return { surface: createSurface(rect.width, rect.height), paneRects: new Map(), paneOrder: [] };
  }

  const surface = createSurface(rect.width, rect.height);
  const painted = paintFrameNodeInto(
    node,
    { row: 0, col: 0, width: rect.width, height: rect.height },
    rect,
    ctx,
    surface,
  );

  return { surface, paneRects: painted.paneRects, paneOrder: painted.paneOrder };
}

function paintFrameNodeInto<PageModel, Msg>(
  node: FrameLayoutNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
): PaintedFrameNodeResult {
  if (localRect.width <= 0 || localRect.height <= 0) {
    return { paneRects: new Map(), paneOrder: [] };
  }

  if (node.kind === 'pane') {
    // Minimized pane: render as collapsed title bar
    if (isMinimized(ctx.visibility, node.paneId)) {
      const titleBar = `[${node.paneId}] \u25b8`; // ▸
      target.blit(blockSurface(titleBar, localRect.width, localRect.height), localRect.col, localRect.row);
      return {
        paneRects: new Map([[node.paneId, absoluteRect]]),
        paneOrder: [node.paneId],
      };
    }

    const prior = ctx.scrollByPane[node.paneId] ?? { x: 0, y: 0 };
    const contentSurface = framePaneOutputToSurface(
      node.render(localRect.width, localRect.height),
      localRect.width,
      localRect.height,
      getFramePaneScratch(localRect.width, localRect.height),
    );
    let state = createFocusAreaStateForSurface(contentSurface, {
      width: localRect.width,
      height: localRect.height,
      overflowX: node.overflowX ?? 'hidden',
    });
    state = focusAreaScrollTo(state, prior.y);
    state = focusAreaScrollToX(state, prior.x);
    focusAreaSurfaceInto(contentSurface, state, target, {
      focused: node.paneId === ctx.focusedPaneId,
      ctx: resolveSafeCtx(),
      id: node.paneId,
      classes: [node.paneId === ctx.focusedPaneId ? 'focused' : 'unfocused'],
    }, localRect.col, localRect.row);
    return {
      paneRects: new Map([[node.paneId, absoluteRect]]),
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
      const mainAxisTotal = direction === 'row' ? localRect.width : localRect.height;
      const minimizedSize = Math.min(1, mainAxisTotal);
      splitState = { ...splitState, ratio: minimizedSize / Math.max(1, mainAxisTotal) };
    } else if (bMinimized && !aMinimized) {
      // B is minimized: give A most of the space
      const mainAxisTotal = direction === 'row' ? localRect.width : localRect.height;
      const minimizedSize = Math.min(1, mainAxisTotal);
      splitState = { ...splitState, ratio: 1 - minimizedSize / Math.max(1, mainAxisTotal) };
    }

    const layout = splitPaneLayout(splitState, {
      direction,
      width: localRect.width,
      height: localRect.height,
      minA: node.minA,
      minB: node.minB,
    });

    const localARect = offsetRect(layout.paneA, localRect.row, localRect.col);
    const localBRect = offsetRect(layout.paneB, localRect.row, localRect.col);
    const absoluteARect = offsetRect(layout.paneA, absoluteRect.row, absoluteRect.col);
    const absoluteBRect = offsetRect(layout.paneB, absoluteRect.row, absoluteRect.col);

    const a = paintFrameNodeInto(effectiveA, localARect, absoluteARect, ctx, target);
    const b = paintFrameNodeInto(effectiveB, localBRect, absoluteBRect, ctx, target);

    paintDivider(target, offsetRect(layout.divider, localRect.row, localRect.col), node.dividerChar, direction);

    return {
      paneRects: mergeMaps(a.paneRects, b.paneRects),
      paneOrder: [...a.paneOrder, ...b.paneOrder],
    };
  }

  const relRects = gridLayout({
    width: localRect.width,
    height: localRect.height,
    columns: node.columns,
    rows: node.rows,
    areas: node.areas,
    gap: node.gap,
  });

  let paneRects = new Map<string, LayoutRect>();
  const seenPaneIds = new Set<string>();
  const paneOrder: string[] = [];
  for (const [areaName, areaRect] of relRects) {
    const localAreaRect = offsetRect(areaRect, localRect.row, localRect.col);
    const absoluteAreaRect = offsetRect(areaRect, absoluteRect.row, absoluteRect.col);
    const child = node.cells[areaName];
    if (child == null) {
      resolveSafeCtx()?.io.writeError(
        `createFramedApp: grid cell "${areaName}" missing in page "${ctx.pageId}" — rendering placeholder\n`,
      );
      target.blit(
        blockSurface(`[missing grid cell: ${areaName}]`, localAreaRect.width, localAreaRect.height),
        localAreaRect.col,
        localAreaRect.row,
      );
      continue;
    }
    const rendered = paintFrameNodeInto(child, localAreaRect, absoluteAreaRect, ctx, target);
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

  return { paneRects, paneOrder };
}

/** Render a placeholder for a grid area that has no matching cell definition. */
export function renderMissingGridCell(areaName: string, rect: LayoutRect): RenderResult {
  return {
    surface: blockSurface(`[missing grid cell: ${areaName}]`, rect.width, rect.height),
    paneRects: new Map(),
    paneOrder: [],
  };
}

/** Render a page's layout tree within the frame body rect. */
export function renderPageContent<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderPageContentInto(pageId, model, bodyRect, pagesById, surface, 0, 0);
  return { surface, paneRects: geometry.paneRects, paneOrder: geometry.paneOrder };
}

/** Paint a page's layout tree directly into an existing target surface. */
export function renderPageContentInto<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  target: Surface,
  offsetRow = bodyRect.row,
  offsetCol = bodyRect.col,
): FramePaneGeometryResult {
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
  return paintFrameNodeInto(
    page.layout(pageModel),
    { row: offsetRow, col: offsetCol, width: bodyRect.width, height: bodyRect.height },
    bodyRect,
    renderCtx,
    target,
  );
}

/** Render only the maximized pane at the full body rect. */
export function renderMaximizedPane<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderMaximizedPaneInto(pageId, model, bodyRect, pagesById, maximizedPaneId, surface, 0, 0);
  return { surface, paneRects: geometry.paneRects, paneOrder: geometry.paneOrder };
}

/** Paint only the maximized pane directly into an existing target surface. */
export function renderMaximizedPaneInto<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
  target: Surface,
  offsetRow = bodyRect.row,
  offsetCol = bodyRect.col,
): FramePaneGeometryResult {
  const page = pagesById.get(pageId)!;
  const pageModel = model.pageModels[pageId]!;
  const layoutTree = page.layout(pageModel);
  const paneNode = findPaneNode(layoutTree, maximizedPaneId);
  if (paneNode == null) {
    // Pane not found, fall back to normal rendering
    return renderPageContentInto(pageId, model, bodyRect, pagesById, target, offsetRow, offsetCol);
  }

  const prior = model.scrollByPage[pageId]?.[maximizedPaneId] ?? { x: 0, y: 0 };
  const contentSurface = framePaneOutputToSurface(
    paneNode.render(bodyRect.width, bodyRect.height),
    bodyRect.width,
    bodyRect.height,
    getFramePaneScratch(bodyRect.width, bodyRect.height),
  );
  let state = createFocusAreaStateForSurface(contentSurface, {
    width: bodyRect.width,
    height: bodyRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  focusAreaSurfaceInto(contentSurface, state, target, {
    focused: true,
    ctx: resolveSafeCtx(),
    id: maximizedPaneId,
    classes: ['focused', 'maximized'],
  }, offsetCol, offsetRow);

  return {
    paneRects: new Map([[maximizedPaneId, bodyRect]]),
    paneOrder: [maximizedPaneId],
  };
}

/** Resolve the top header line plus clickable tab target geometry. */
export function resolveHeaderLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): FrameHeaderRenderResult {
  const title = options.title ?? 'App';
  let cursor = visibleLength(title) + 2;
  const tabTargets: FrameHeaderTabTarget[] = [];
  const tabs = model.pageOrder.map((id, index) => {
    const page = pagesById.get(id)!;
    const label = id === model.activePageId ? `[${page.title}]` : ` ${page.title} `;
    const width = visibleLength(label);
    const startCol = cursor;
    const endCol = cursor + width - 1;
    if (endCol >= 0 && startCol < model.columns) {
      tabTargets.push({
        pageId: id,
        startCol: Math.max(0, startCol),
        endCol: Math.min(Math.max(0, model.columns - 1), endCol),
      });
    }
    cursor += width;
    if (index < model.pageOrder.length - 1) {
      cursor += 1;
    }
    return label;
  }).join(' ');

  const line = fitLine(`${title}  ${tabs}`, model.columns);
  return {
    surface: createStyledTextSurfaceWithBCSS(line, model.columns, resolveSafeCtx(), {
      type: 'FrameHeader',
      id: 'frame-header',
      classes: [`page-${model.activePageId}`],
    }),
    tabTargets,
  };
}

/** Render the footer status line showing mode, focused pane, and key hints. */
export function renderHelpLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  frameKeys: KeyMap<FrameAction>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  activePage: FramePage<PageModel, Msg>,
): Surface {
  const mode = model.commandPalette != null
    ? 'PALETTE'
    : model.helpOpen
      ? 'HELP'
      : model.quitConfirmOpen
        ? 'QUIT'
      : model.settingsOpen
        ? 'SETTINGS'
        : 'NORMAL';
  const focusedPane = model.focusedPaneByPage[model.activePageId] ?? '-';
  const status = `[${mode}] page:${model.activePageId} pane:${focusedPane}`;

  const hint = model.settingsOpen && model.commandPalette == null && !model.helpOpen
    ? 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit'
    : model.quitConfirmOpen
      ? 'Y quit • N stay'
    : helpShort(options.helpLineSource?.({
      model,
      activePage,
      frameKeys,
      globalKeys: options.globalKeys,
    }) ?? mergeBindingSources(
      frameKeys,
      options.globalKeys,
      activePage.helpSource ?? activePage.keyMap,
    ));
  const line = hint.length > 0
    ? (() => {
        const statusWithPadding = ` ${status}`;
        const gap = model.columns - visibleLength(statusWithPadding) - visibleLength(hint);
        return gap >= 2
          ? `${statusWithPadding}${' '.repeat(gap)}${hint}`
          : `${statusWithPadding}  ${hint}`;
      })()
    : ` ${status}`;
  return createStyledTextSurfaceWithBCSS(fitLine(line, model.columns), model.columns, resolveSafeCtx(), {
    type: 'FrameHelp',
    id: 'frame-help',
    classes: [`mode-${mode.toLowerCase()}`, `page-${model.activePageId}`],
  });
}

/**
/**
 * Apply a transition shader to blend between the previous and next page views.
 *
 * @param frame - Monotonic frame counter passed to shaders for temporal effects
 *   (glitch flickering, static noise). Defaults to 0 for stateless shaders.
 */
export function renderTransition(
  prev: Surface,
  next: Surface,
  style: PageTransition,
  progress: number,
  width: number,
  height: number,
  ctx: BijouContext,
  frame = 0,
): Surface {
  const shader = typeof style === 'function' ? style : TRANSITION_SHADERS[style];
  if (!shader || width <= 0 || height <= 0) return next;

  const surface = createSurface(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const rand = seed - Math.floor(seed);
      const result = shader({ x, y, width, height, progress, rand, frame, ctx });
      const baseCell = result.showNext ? next.get(x, y) : prev.get(x, y);
      surface.set(x, y, applyTransitionCell(baseCell, result));
    }
  }

  return surface;
}

export function framePaneOutputToSurface(
  output: ViewOutput,
  width: number,
  height: number,
  scratch?: Surface,
): Surface {
  return scratch == null
    ? normalizeViewOutput(output, { width, height }).surface
    : normalizeViewOutputInto(output, { width, height }, scratch).surface;
}

export function blockSurface(content: string, width: number, height: number): Surface {
  return parseAnsiToSurface(fitBlock(content, width, height).join('\n'), width, height);
}

function paintDivider(
  target: Surface,
  rect: LayoutRect,
  dividerChar: string | undefined,
  direction: 'row' | 'column',
): void {
  const unit = resolveDividerUnit(dividerChar, direction === 'row' ? '│' : '─');
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      target.set(rect.col + x, rect.row + y, { char: unit, empty: false });
    }
  }
}

function resolveDividerUnit(dividerChar: string | undefined, fallback: string): string {
  if (dividerChar == null || dividerChar.length === 0) return fallback;
  return dividerChar[0] ?? fallback;
}

function getFramePaneScratch(width: number, height: number): Surface {
  const key = `${width}x${height}`;
  let scratch = framePaneScratchBySize.get(key);
  if (scratch == null) {
    scratch = createSurface(width, height);
    framePaneScratchBySize.set(key, scratch);
  }
  return scratch;
}

function applyTransitionCell(
  baseCell: Cell,
  result: TransitionResult,
): Cell {
  if (result.overrideCell != null) {
    return {
      ...baseCell,
      ...result.overrideCell,
      char: result.overrideCell.char,
      empty: false,
    };
  }
  if (result.overrideChar !== undefined) {
    return {
      ...baseCell,
      char: result.overrideChar,
      empty: false,
    };
  }
  return {
    ...baseCell,
    empty: false,
  };
}
