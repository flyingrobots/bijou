/**
 * Layout rendering for `app-frame.ts`.
 *
 * Recursive tree renderer, page content, maximized pane, header/help lines,
 * transition shader, and string-to-grid tokenization.
 */

import { resolveSafeCtx, surfaceToString, type BijouContext, type Surface } from '@flyingrobots/bijou';
import type { FrameLayoutNode, FramePage, CreateFramedAppOptions } from './app-frame.js';
import type { InternalFrameModel, RenderContext, RenderResult, FrameAction } from './app-frame-types.js';
import type { LayoutRect } from './layout-rect.js';
import type { PageTransition } from './app-frame.js';
import { TRANSITION_SHADERS } from './transition-shaders.js';
import { fitBlock } from './layout-utils.js';
import { splitPane, splitPaneLayout } from './split-pane.js';
import { grid, gridLayout } from './grid.js';
import {
  createFocusAreaState,
  focusArea,
  focusAreaScrollTo,
  focusAreaScrollToX,
} from './focus-area.js';
import { isMinimized, createPanelVisibilityState } from './panel-state.js';
import { createPanelDockState, resolveChildOrder, getNodeId } from './panel-dock.js';
import { tokenizeAnsi, visibleLength } from './viewport.js';
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
import { normalizeViewOutput, type ViewOutput } from './view-output.js';
import { styleTextWithBCSS } from './css/text-style.js';

export interface FrameHeaderTabTarget {
  readonly pageId: string;
  readonly startCol: number;
  readonly endCol: number;
}

export interface FrameHeaderRenderResult {
  readonly line: string;
  readonly tabTargets: readonly FrameHeaderTabTarget[];
}

/** Recursively render a layout tree node (pane, split, or grid) into a rect. */
export function renderFrameNode<PageModel, Msg>(
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
    const content = framePaneOutputToString(node.render(rect.width, rect.height), rect.width, rect.height);
    let state = createFocusAreaState({
      content,
      width: rect.width,
      height: rect.height,
      overflowX: node.overflowX ?? 'hidden',
    });
    state = focusAreaScrollTo(state, prior.y);
    state = focusAreaScrollToX(state, prior.x);
    const output = focusArea(state, {
      focused: node.paneId === ctx.focusedPaneId,
      ctx: resolveSafeCtx(),
      id: node.paneId,
      classes: [node.paneId === ctx.focusedPaneId ? 'focused' : 'unfocused'],
    });
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
export function renderMissingGridCell(areaName: string, rect: LayoutRect): RenderResult {
  return {
    output: fitBlock(`[missing grid cell: ${areaName}]`, rect.width, rect.height).join('\n'),
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

/** Render only the maximized pane at the full body rect. */
export function renderMaximizedPane<PageModel, Msg>(
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
  const content = framePaneOutputToString(paneNode.render(bodyRect.width, bodyRect.height), bodyRect.width, bodyRect.height);
  let state = createFocusAreaState({
    content,
    width: bodyRect.width,
    height: bodyRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  const output = focusArea(state, {
    focused: true,
    ctx: resolveSafeCtx(),
    id: maximizedPaneId,
    classes: ['focused', 'maximized'],
  });

  return {
    output,
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
    line: styleTextWithBCSS(line, resolveSafeCtx(), {
      type: 'FrameHeader',
      id: 'frame-header',
      classes: [`page-${model.activePageId}`],
    }),
    tabTargets,
  };
}

/** Render the top header line showing the app title and tab bar. */
export function renderHeaderLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
): string {
  return resolveHeaderLine(model, options, pagesById).line;
}

/** Render the bottom status line showing mode, focused pane, and key hints. */
export function renderHelpLine<PageModel, Msg>(
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

  const source = options.helpLineSource?.({
    model,
    activePage,
    frameKeys,
    globalKeys: options.globalKeys,
  }) ?? mergeBindingSources(
    frameKeys,
    options.globalKeys,
    activePage.helpSource ?? activePage.keyMap,
  );
  const hint = helpShort(source);
  const line = hint.length > 0
    ? ` ${status}  ${hint}`
    : ` ${status}`;
  return styleTextWithBCSS(fitLine(line, model.columns), resolveSafeCtx(), {
    type: 'FrameHelp',
    id: 'frame-help',
    classes: [`mode-${mode.toLowerCase()}`, `page-${model.activePageId}`],
  });
}

/**
 * Split a styled multiline string into a 2D grid of single-column characters.
 * Each cell is a fully-styled string (including resets).
 */
export function stringToGrid(str: string, width: number, height: number): string[][] {
  const lines = str.split('\n');
  const grid: string[][] = [];

  for (let y = 0; y < height; y++) {
    const line = lines[y] ?? '';
    grid.push(tokenizeAnsi(line, width));
  }
  return grid;
}

/**
 * Apply a transition shader to blend between the previous and next page views.
 *
 * @param frame - Monotonic frame counter passed to shaders for temporal effects
 *   (glitch flickering, static noise). Defaults to 0 for stateless shaders.
 */
export function renderTransition(
  prev: string,
  next: string,
  style: PageTransition,
  progress: number,
  width: number,
  height: number,
  ctx: BijouContext,
  frame = 0,
): string {
  const shader = typeof style === 'function' ? style : TRANSITION_SHADERS[style];
  if (!shader) return next;
  if (width <= 0 || height <= 0) return next;

  const prevGrid = stringToGrid(prev, width, height);
  const nextGrid = stringToGrid(next, width, height);
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      // Shared stable-ish pseudo-random seed based on coordinates
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const rand = seed - Math.floor(seed);

      const result = shader({ x, y, width, height, progress, rand, frame, ctx });
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

export function framePaneOutputToString(output: ViewOutput, width: number, height: number): string {
  const surface = normalizeViewOutput(output, { width, height }).surface;
  const ctx = resolveSafeCtx();
  if (ctx?.style) {
    return surfaceToString(surface, ctx.style);
  }

  return surfaceToPlainText(surface);
}

function surfaceToPlainText(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}
