import type { BijouContext, Surface } from '@flyingrobots/bijou';
import type { CreateFramedAppOptions, FramePage } from './app-frame.js';
import { paintActiveHeaderTab } from './app-frame-render-colors.js';
import type { FrameHeaderRenderResult } from './app-frame-render-contract.js';
import {
  applySurfaceBackground,
  resolveFrameBackgroundToken,
  resolveRenderCtx,
} from './app-frame-render-surface.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { fitLine, resolveFramePageText } from './app-frame-utils.js';
import { frameModeLabel } from './app-frame-i18n.js';
import type { FrameLayerDescriptor } from './app-frame-layers.js';
import { paintStyledTextSurfaceWithBCSS } from './css/text-style.js';
import { helpShort } from './help.js';
import { visibleLength } from './viewport.js';
import { required } from './app-frame-render-scratch.js';

type FrameMode = Parameters<typeof frameModeLabel>[1];

/** Resolve the top header line plus clickable tab target geometry. */
export function resolveHeaderLine<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  scratch?: Surface,
  ctx?: BijouContext,
): FrameHeaderRenderResult {
  const renderCtx = resolveRenderCtx(ctx);
  const activePage = required(
    pagesById.get(model.activePageId),
    `page "${model.activePageId}"`,
  );
  const activeModel = required(
    model.pageModels[model.activePageId],
    `page model "${model.activePageId}"`,
  );
  const headerStyle = options.headerStyle?.({
    model,
    activePage,
    pageModel: activeModel,
  });
  const title = options.title ?? 'App';
  let cursor = visibleLength(title) + 2;
  const tabTargets: FrameHeaderRenderResult['tabTargets'][number][] = [];
  const tabs = model.pageOrder
    .map((id, index) => {
      const page = required(pagesById.get(id), `page "${id}"`);
      const pageModel = required(model.pageModels[id], `page model "${id}"`);
      const pageTitle = resolveFramePageText(page.title, pageModel) ?? '';
      const label =
        id === model.activePageId ? `[${pageTitle}]` : ` ${pageTitle} `;
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
      cursor += width + (index < model.pageOrder.length - 1 ? 1 : 0);
      return label;
    })
    .join(' ');
  const line = fitLine(`${title}  ${tabs}`, model.columns);
  const surface = paintStyledTextSurfaceWithBCSS(
    scratch,
    line,
    model.columns,
    renderCtx,
    {
      type: 'FrameHeader',
      id: 'frame-header',
      classes: [`page-${model.activePageId}`],
    },
  );
  paintActiveHeaderTab(
    surface,
    tabTargets,
    model.activePageId,
    renderCtx,
    headerStyle?.activeTabToken,
  );
  applySurfaceBackground(surface, resolveFrameBackgroundToken(renderCtx));
  return { surface, tabTargets };
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
  const mode = layerMode(activeLayer.kind);
  const focusedPane = model.focusedPaneByPage[model.activePageId] ?? '-';
  const modeLabel = frameModeLabel(i18n, mode);
  const cue =
    notificationCue == null || notificationCue.length === 0
      ? ''
      : ` ${notificationCue}`;
  const status = `[${modeLabel}] page:${model.activePageId} pane:${focusedPane}${cue}`;
  const hint =
    typeof activeLayer.hintSource === 'string'
      ? activeLayer.hintSource
      : activeLayer.hintSource == null
        ? ''
        : helpShort(activeLayer.hintSource);
  const statusWithPadding = ` ${status}`;
  const gap =
    model.columns - visibleLength(statusWithPadding) - visibleLength(hint);
  const line =
    hint.length === 0
      ? statusWithPadding
      : gap >= 2
        ? `${statusWithPadding}${' '.repeat(gap)}${hint}`
        : `${statusWithPadding}  ${hint}`;
  const surface = paintStyledTextSurfaceWithBCSS(
    scratch,
    fitLine(line, model.columns),
    model.columns,
    renderCtx,
    {
      type: 'FrameHelp',
      id: 'frame-help',
      classes: [`mode-${mode.toLowerCase()}`, `page-${model.activePageId}`],
    },
  );
  return applySurfaceBackground(
    surface,
    resolveFrameBackgroundToken(renderCtx),
  );
}

function layerMode(kind: FrameLayerDescriptor['kind']): FrameMode {
  if (kind === 'search' || kind === 'command-palette') return 'PALETTE';
  if (kind === 'help') return 'HELP';
  if (kind === 'quit-confirm') return 'QUIT';
  if (kind === 'settings') return 'SETTINGS';
  if (kind === 'notification-center') return 'NOTICES';
  if (kind === 'page-modal') return 'MODAL';
  return 'NORMAL';
}
