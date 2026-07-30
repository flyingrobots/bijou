import {
  preferenceListSurface,
  type BijouContext,
} from '@flyingrobots/bijou';
import type {
  CreateFramedAppOptions,
  FramePage,
} from './app-frame.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlay-contract.js';
import { frameMessage } from './app-frame-i18n.js';
import {
  clampSettingsFocus,
  clampSettingsScroll,
  resolveSettingsLayout,
} from './app-frame-overlay-layout.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { drawer, type Overlay } from './overlay.js';
import { createPagerStateForSurface, pagerSurface } from './pager.js';

export function renderSettingsDrawer<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  options: CreateFramedAppOptions<PageModel, Msg>,
  pagesById: Map<string, FramePage<PageModel, Msg>>,
  shellThemes: readonly ResolvedFrameShellTheme[],
  titleOverride?: string,
  ctx?: BijouContext,
): Overlay | undefined {
  const layout = resolveSettingsLayout(
    model,
    options,
    pagesById,
    shellThemes,
  );
  if (layout == null) return undefined;
  const content = preferenceListSurface(layout.preferenceSections, {
    width: layout.contentWidth,
    selectedRowId:
      layout.rows[clampSettingsFocus(model, layout)]?.row.id,
    ctx,
    theme: layout.settings.listTheme,
  });
  const pagerState = createPagerStateForSurface(content, {
    width: layout.contentWidth,
    height: layout.contentHeight,
  });
  const body = pagerSurface(
    content,
    {
      ...pagerState,
      scroll: {
        ...pagerState.scroll,
        y: clampSettingsScroll(model, layout),
      },
    },
    {
      showScrollbar: layout.maxScrollY > 0,
      showStatus: false,
    },
  );
  return drawer({
    anchor: layout.anchor,
    title:
      titleOverride ??
      layout.settings.title ??
      frameMessage(options.i18n, 'settings.title', 'Settings'),
    content: body,
    borderToken: layout.settings.borderToken,
    bgToken: layout.settings.bgToken,
    ctx,
    width: layout.drawerWidth,
    screenWidth: model.columns,
    screenHeight: model.rows,
  });
}
