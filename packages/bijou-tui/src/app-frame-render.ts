/**
 * Layout rendering for `app-frame.ts`.
 *
 * Recursive tree renderer, page content, maximized pane, header/help lines,
 * transition shader, and surface/string bridge helpers.
 */

import {
  createSurface,
  darken,
  hexToRgb,
  lighten,
  mix,
  parseAnsiToSurface,
  resolveSafeCtx,
  saturate,
  type Cell,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '@flyingrobots/bijou';
import type { FrameLayoutNode, FramePage, CreateFramedAppOptions } from './app-frame.js';
import type { InternalFrameModel, RenderContext, RenderResult } from './app-frame-types.js';
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
import {
  findPaneNode,
  isPaneMinimized,
  mergeMaps,
  offsetRect,
  fitLine,
} from './app-frame-utils.js';
import { normalizeViewOutput, normalizeViewOutputInto, type ViewOutput } from './view-output.js';
import { paintStyledTextSurfaceWithBCSS } from './css/text-style.js';
import { frameModeLabel } from './app-frame-i18n.js';
import type { FrameLayerDescriptor } from './app-frame-layers.js';

export interface FrameHeaderTabTarget {
  readonly pageId: string;
  readonly startCol: number;
  readonly endCol: number;
}

export interface FrameHeaderRenderResult {
  readonly surface: Surface;
  readonly tabTargets: readonly FrameHeaderTabTarget[];
}

interface PaintedFrameNodeResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

export interface FramePaneGeometryResult {
  readonly paneRects: ReadonlyMap<string, LayoutRect>;
  readonly paneOrder: readonly string[];
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex);
  const r = srgbChannelToLinear(red);
  const g = srgbChannelToLinear(green);
  const b = srgbChannelToLinear(blue);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

function deriveActiveHeaderTabToken(ctx: BijouContext, backgroundHex: string, baseHex: string): TokenValue {
  const darkBackground = relativeLuminance(backgroundHex) < 0.35;
  const accent = ctx.semantic('accent');
  const info = ctx.semantic('info');
  const primary = ctx.semantic('primary');
  const warning = ctx.semantic('warning');
  const seeds: TokenValue[] = [
    accent,
    info,
    mix(accent, info, 0.5),
    mix(accent, warning, 0.3),
    mix(primary, accent, 0.3),
  ];

  const candidates = seeds.flatMap((seed) => {
    const emphasized = saturate(seed, 0.35);
    return darkBackground
      ? [
          emphasized,
          lighten(seed, 0.18),
          lighten(emphasized, 0.3),
          lighten(mix(seed, primary, 0.25), 0.2),
        ]
      : [
          darken(seed, 0.18),
          darken(emphasized, 0.28),
          darken(mix(seed, primary, 0.1), 0.22),
        ];
  });

  let best = candidates[0] ?? accent;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    const contrast = contrastRatio(candidate.hex, backgroundHex);
    const distance = colorDistance(candidate.hex, baseHex) / Math.sqrt(3 * 255 * 255);
    const score = contrast * 3 + distance;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return {
    hex: best.hex,
    modifiers: ['bold'],
  };
}

function paintActiveHeaderTab(
  surface: Surface,
  tabTargets: readonly FrameHeaderTabTarget[],
  activePageId: string,
  ctx: BijouContext | undefined,
  tokenOverride?: TokenValue,
): void {
  if (ctx == null) return;
  const activeTarget = tabTargets.find((target) => target.pageId === activePageId);
  if (activeTarget == null) return;
  const sampleCell = surface.get(activeTarget.startCol, 0);
  const backgroundHex = (typeof sampleCell.bg === 'string' ? sampleCell.bg : sampleCell.bg?.hex)
    ?? ctx.surface('primary').bg
    ?? ctx.surface('secondary').bg
    ?? '#000000';
  const baseHex = (typeof sampleCell.fg === 'string' ? sampleCell.fg : sampleCell.fg?.hex)
    ?? ctx.surface('primary').hex
    ?? ctx.semantic('primary').hex;
  const token = tokenOverride ?? deriveActiveHeaderTabToken(ctx, backgroundHex, baseHex);

  for (let x = activeTarget.startCol; x <= activeTarget.endCol; x++) {
    const cell = surface.get(x, 0);
    const nextCell: Cell = {
      ...cell,
      fg: token.hex,
      bg: token.bg ?? cell.bg,
      fgRGB: token.fgRGB,
      bgRGB: token.bgRGB,
      modifiers: token.modifiers == null
        ? cell.modifiers
        : Array.from(new Set([...(cell.modifiers ?? []), ...token.modifiers])),
      empty: false,
    };
    surface.set(x, 0, nextCell);
  }
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
    createFramePaneScratchPool(),
  );

  return { surface, paneRects: painted.paneRects, paneOrder: painted.paneOrder };
}

function paintFrameNodeInto<PageModel, Msg>(
  node: FrameLayoutNode,
  localRect: LayoutRect,
  absoluteRect: LayoutRect,
  ctx: RenderContext<PageModel, Msg>,
  target: Surface,
  scratchPool: FramePaneScratchPool,
): PaintedFrameNodeResult {
  if (localRect.width <= 0 || localRect.height <= 0) {
    return { paneRects: new Map(), paneOrder: [] };
  }

  if (node.kind === 'pane') {
    // Minimized pane: render as collapsed title bar
    if (isMinimized(ctx.visibility, node.paneId)) {
      const titleBar = `[${node.paneId}] \u25b8`; // ▸
      target.blit(
        applySurfaceBackground(blockSurface(titleBar, localRect.width, localRect.height), ctx.frameBackgroundToken),
        localRect.col,
        localRect.row,
      );
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
      getFramePaneScratch(scratchPool, localRect.width, localRect.height),
    );
    applySurfaceBackground(contentSurface, ctx.frameBackgroundToken);
    let state = createFocusAreaStateForSurface(contentSurface, {
      width: localRect.width,
      height: localRect.height,
      overflowX: node.overflowX ?? 'hidden',
    });
    state = focusAreaScrollTo(state, prior.y);
    state = focusAreaScrollToX(state, prior.x);
    focusAreaSurfaceInto(contentSurface, state, target, {
      focused: node.paneId === ctx.focusedPaneId,
      ctx: ctx.ctx,
      id: node.paneId,
      classes: [node.paneId === ctx.focusedPaneId ? 'focused' : 'unfocused'],
      focusedGutterToken: node.focusedGutterToken,
      unfocusedGutterToken: node.unfocusedGutterToken,
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

    const a = paintFrameNodeInto(effectiveA, localARect, absoluteARect, ctx, target, scratchPool);
    const b = paintFrameNodeInto(effectiveB, localBRect, absoluteBRect, ctx, target, scratchPool);

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
      ctx.ctx?.io.writeError(
        `createFramedApp: grid cell "${areaName}" missing in page "${ctx.pageId}" — rendering placeholder\n`,
      );
      target.blit(
        renderMissingGridCell(areaName, localAreaRect, ctx.frameBackgroundToken).surface,
        localAreaRect.col,
        localAreaRect.row,
      );
      continue;
    }
    const rendered = paintFrameNodeInto(child, localAreaRect, absoluteAreaRect, ctx, target, scratchPool);
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
export function renderMissingGridCell(
  areaName: string,
  rect: LayoutRect,
  frameBackgroundToken?: TokenValue,
): RenderResult {
  return {
    surface: applySurfaceBackground(
      blockSurface(`[missing grid cell: ${areaName}]`, rect.width, rect.height),
      frameBackgroundToken,
    ),
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
  ctx?: BijouContext,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderPageContentInto(pageId, model, bodyRect, pagesById, surface, 0, 0, createFramePaneScratchPool(), ctx);
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
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): FramePaneGeometryResult {
  const themeCtx = resolveRenderCtx(ctx);
  const frameBackgroundToken = resolveFrameBackgroundToken(themeCtx);
  fillSurfaceBackground(target, offsetCol, offsetRow, bodyRect.width, bodyRect.height, frameBackgroundToken);
  const page = pagesById.get(pageId)!;
  const pageModel = model.pageModels[pageId]!;
  const renderCtx: RenderContext<PageModel, Msg> = {
    model,
    pageId,
    focusedPaneId: model.focusedPaneByPage[pageId],
    scrollByPane: model.scrollByPage[pageId] ?? {},
    visibility: model.minimizedByPage[pageId] ?? createPanelVisibilityState(),
    dockState: model.dockStateByPage[pageId] ?? createPanelDockState(),
    frameBackgroundToken,
    ctx: themeCtx,
  };
  return paintFrameNodeInto(
    page.layout(pageModel),
    { row: offsetRow, col: offsetCol, width: bodyRect.width, height: bodyRect.height },
    bodyRect,
    renderCtx,
    target,
    scratchPool,
  );
}

/** Render only the maximized pane at the full body rect. */
export function renderMaximizedPane<PageModel, Msg>(
  pageId: string,
  model: InternalFrameModel<PageModel, Msg>,
  bodyRect: LayoutRect,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  maximizedPaneId: string,
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): RenderResult {
  const surface = createSurface(bodyRect.width, bodyRect.height);
  const geometry = renderMaximizedPaneInto(pageId, model, bodyRect, pagesById, maximizedPaneId, surface, 0, 0, scratchPool, ctx);
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
  scratchPool: FramePaneScratchPool = createFramePaneScratchPool(),
  ctx?: BijouContext,
): FramePaneGeometryResult {
  const themeCtx = resolveRenderCtx(ctx);
  const frameBackgroundToken = resolveFrameBackgroundToken(themeCtx);
  fillSurfaceBackground(target, offsetCol, offsetRow, bodyRect.width, bodyRect.height, frameBackgroundToken);
  const page = pagesById.get(pageId)!;
  const pageModel = model.pageModels[pageId]!;
  const layoutTree = page.layout(pageModel);
  const paneNode = findPaneNode(layoutTree, maximizedPaneId);
  if (paneNode == null) {
    // Pane not found, fall back to normal rendering
    return renderPageContentInto(pageId, model, bodyRect, pagesById, target, offsetRow, offsetCol, scratchPool, ctx);
  }

  const prior = model.scrollByPage[pageId]?.[maximizedPaneId] ?? { x: 0, y: 0 };
  const contentSurface = framePaneOutputToSurface(
    paneNode.render(bodyRect.width, bodyRect.height),
    bodyRect.width,
    bodyRect.height,
    getFramePaneScratch(scratchPool, bodyRect.width, bodyRect.height),
  );
  applySurfaceBackground(contentSurface, frameBackgroundToken);
  let state = createFocusAreaStateForSurface(contentSurface, {
    width: bodyRect.width,
    height: bodyRect.height,
    overflowX: paneNode.overflowX ?? 'hidden',
  });
  state = focusAreaScrollTo(state, prior.y);
  state = focusAreaScrollToX(state, prior.x);
  focusAreaSurfaceInto(contentSurface, state, target, {
    focused: true,
    ctx: themeCtx,
    id: maximizedPaneId,
    classes: ['focused', 'maximized'],
    focusedGutterToken: paneNode.focusedGutterToken,
    unfocusedGutterToken: paneNode.unfocusedGutterToken,
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
  scratch?: Surface,
  ctx?: BijouContext,
): FrameHeaderRenderResult {
  const renderCtx = resolveRenderCtx(ctx);
  const frameBackgroundToken = resolveFrameBackgroundToken(renderCtx);
  const activePage = pagesById.get(model.activePageId)!;
  const activePageModel = model.pageModels[model.activePageId]!;
  const headerStyle = options.headerStyle?.({
    model,
    activePage,
    pageModel: activePageModel,
  });
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
  const surface = paintStyledTextSurfaceWithBCSS(scratch, line, model.columns, renderCtx, {
    type: 'FrameHeader',
    id: 'frame-header',
    classes: [`page-${model.activePageId}`],
  });
  paintActiveHeaderTab(surface, tabTargets, model.activePageId, renderCtx, headerStyle?.activeTabToken);
  applySurfaceBackground(surface, frameBackgroundToken);
  return {
    surface,
    tabTargets,
  };
}

/** Render the footer status line showing mode, focused pane, and key hints. */
export function renderHelpLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  activeLayer: FrameLayerDescriptor,
  i18n: CreateFramedAppOptions<PageModel, Msg>['i18n'],
  notificationCue?: string,
  scratch?: Surface,
  ctx?: BijouContext,
): Surface {
  const renderCtx = resolveRenderCtx(ctx);
  const mode = activeLayer.kind === 'search' || activeLayer.kind === 'command-palette'
    ? 'PALETTE'
    : activeLayer.kind === 'help'
      ? 'HELP'
      : activeLayer.kind === 'quit-confirm'
        ? 'QUIT'
        : activeLayer.kind === 'settings'
          ? 'SETTINGS'
          : activeLayer.kind === 'notification-center'
            ? 'NOTICES'
            : activeLayer.kind === 'page-modal'
              ? 'MODAL'
              : 'NORMAL';
  const focusedPane = model.focusedPaneByPage[model.activePageId] ?? '-';
  const modeLabel = frameModeLabel(i18n, mode);
  const status = notificationCue == null || notificationCue.length === 0
    ? `[${modeLabel}] page:${model.activePageId} pane:${focusedPane}`
    : `[${modeLabel}] page:${model.activePageId} pane:${focusedPane} ${notificationCue}`;

  const hint = typeof activeLayer.hintSource === 'string'
    ? activeLayer.hintSource
    : activeLayer.hintSource == null
      ? ''
      : helpShort(activeLayer.hintSource);
  const line = hint.length > 0
    ? (() => {
        const statusWithPadding = ` ${status}`;
        const gap = model.columns - visibleLength(statusWithPadding) - visibleLength(hint);
        return gap >= 2
          ? `${statusWithPadding}${' '.repeat(gap)}${hint}`
          : `${statusWithPadding}  ${hint}`;
      })()
    : ` ${status}`;
  return applySurfaceBackground(paintStyledTextSurfaceWithBCSS(scratch, fitLine(line, model.columns), model.columns, renderCtx, {
    type: 'FrameHelp',
    id: 'frame-help',
    classes: [`mode-${mode.toLowerCase()}`, `page-${model.activePageId}`],
  }), resolveFrameBackgroundToken(renderCtx));
}

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

function resolveFrameBackgroundToken(ctx: BijouContext | undefined): TokenValue | undefined {
  const primary = ctx?.surface('primary');
  if (primary?.bg != null || primary?.bgRGB != null) return primary;
  const secondary = ctx?.surface('secondary');
  if (secondary?.bg != null || secondary?.bgRGB != null) return secondary;
  return undefined;
}

function resolveRenderCtx(ctx: BijouContext | undefined): BijouContext | undefined {
  return ctx ?? resolveSafeCtx();
}

function fillSurfaceBackground(
  target: Surface,
  offsetCol: number,
  offsetRow: number,
  width: number,
  height: number,
  backgroundToken: TokenValue | undefined,
): void {
  if (backgroundToken == null || width <= 0 || height <= 0) return;
  if (backgroundToken.bg == null && backgroundToken.bgRGB == null) return;
  target.fill({
    char: ' ',
    bg: backgroundToken.bg,
    bgRGB: backgroundToken.bgRGB,
    empty: false,
  }, offsetCol, offsetRow, width, height);
}

function applySurfaceBackground(surface: Surface, backgroundToken: TokenValue | undefined): Surface {
  if (backgroundToken == null) return surface;
  if (backgroundToken.bg == null && backgroundToken.bgRGB == null) return surface;
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      if (cell.bg != null || cell.bgRGB != null) continue;
      surface.set(x, y, {
        ...cell,
        char: cell.char.length > 0 ? cell.char : ' ',
        bg: backgroundToken.bg,
        bgRGB: backgroundToken.bgRGB,
        empty: false,
      });
    }
  }
  return surface;
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
      const existing = target.get(rect.col + x, rect.row + y);
      target.set(rect.col + x, rect.row + y, { ...existing, char: unit, empty: false });
    }
  }
}

function resolveDividerUnit(dividerChar: string | undefined, fallback: string): string {
  if (dividerChar == null || dividerChar.length === 0) return fallback;
  return dividerChar[0] ?? fallback;
}

/** Per-size scratch surface pool for pane rendering. */
export type FramePaneScratchPool = Map<string, Surface>;

export function createFramePaneScratchPool(): FramePaneScratchPool {
  return new Map();
}

function getFramePaneScratch(pool: FramePaneScratchPool, width: number, height: number): Surface {
  const key = `${width}x${height}`;
  let scratch = pool.get(key);
  if (scratch == null) {
    scratch = createSurface(width, height);
    pool.set(key, scratch);
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
