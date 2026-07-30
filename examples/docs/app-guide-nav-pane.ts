import type {
  BijouContext,
  Surface,
} from '../../packages/bijou/src/index.js';
import { browsableListSurface } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, proseSurface } from '../_shared/example-surfaces.js';
import {
  docsThemeAccentToken,
  docsThemeMutedBorderToken,
} from './app-docs-theme-tokens.js';
import {
  localizedGuideStateForPage,
} from './app-guide-access.js';
import type { DocsPageId } from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { pageTitle } from './app-page-title.js';
import { navigationListBlock } from './dogfood-blocks.js';
import { formatGuideRow } from './app-row-format.js';

export function renderGuideNavPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  _height: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const loweredMode =
    context.mode === 'pipe' || context.mode === 'accessible';
  const guideState = localizedGuideStateForPage(
    pageId,
    model,
    localization,
  );
  const focusedGuideId =
    guideState.items[guideState.focusIndex]?.value;
  const navigation = navigationListBlock.render({
    config: {
      activeItemId: loweredMode
        ? focusedGuideId ?? model.selectedGuideId
        : model.selectedGuideId,
      items: guideState.items.map((item) => ({
        id: item.value,
        label: item.label,
      })),
    },
    mode: context.mode,
  });
  const body = loweredMode
    ? proseSurface(navigation.output, Math.max(1, paneWidth))
    : browsableListSurface(guideState, {
        width: Math.max(1, paneWidth),
        showScrollbar: true,
        ctx: context,
        focusedRowOverflow: {
          mode: 'marquee',
          elapsedMs: model.previewTimeMs,
        },
        renderItem: ({ item, focused }) =>
          formatGuideRow({
            item,
            focused,
            selectedGuideId: model.selectedGuideId,
            ctx: context,
            tokens: {
              accent: docsThemeAccentToken(theme),
              muted: docsThemeMutedBorderToken(theme),
            },
          }),
      });
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        pageTitle(pageId, localization).toLowerCase(),
        paneWidth,
        context,
        theme,
      ),
      body,
    ]),
    width,
  );
}
