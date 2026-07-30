import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { FrameLayoutNode } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { docsThemeUnfocusedGutterToken } from './app-docs-theme-tokens.js';
import { renderGuideInfoPane } from './app-guide-info-pane.js';
import { renderGuideNavPane } from './app-guide-nav-pane.js';
import { renderGuideReaderPane } from './app-guide-reader-pane.js';
import {
  DOCS_FLEX_TRACK,
  DOCS_SIDEBAR_WIDTH,
  type DocsPageId,
} from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import { docsNavWidthForVariant } from './app-pane-geometry.js';

export function createGuidePageLayout(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  theme: LandingThemeTokens,
  getContext: () => BijouContext,
  localization: LocalizationPort,
): FrameLayoutNode {
  const nav: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-nav',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) =>
      renderGuideNavPane(
        pageId,
        model,
        width,
        height,
        getContext(),
        theme,
        localization,
      ),
  };
  const main: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-content',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) =>
      renderGuideReaderPane(
        pageId,
        model,
        width,
        getContext(),
        theme,
        localization,
      ),
  };
  const meta: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'guide-meta',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) =>
      renderGuideInfoPane(
        pageId,
        model,
        width,
        getContext(),
        theme,
        localization,
      ),
  };
  if (model.layoutVariant === 'tiny') return main;
  const navWidth = docsNavWidthForVariant(model.layoutVariant);
  if (model.layoutVariant !== 'wide') {
    return {
      kind: 'grid',
      gridId: `docs-${pageId}`,
      columns:
        model.layoutVariant === 'narrow'
          ? [1, navWidth, 1, DOCS_FLEX_TRACK]
          : [1, navWidth, 1, DOCS_FLEX_TRACK, 1],
      rows: [1, DOCS_FLEX_TRACK, 1],
      areas:
        model.layoutVariant === 'narrow'
          ? ['. . . .', '. nav . main', '. . . .']
          : ['. . . . .', '. nav . main .', '. . . . .'],
      gap: 0,
      cells: { nav, main },
    };
  }
  return {
    kind: 'grid',
    gridId: `docs-${pageId}`,
    columns: [
      1,
      DOCS_SIDEBAR_WIDTH,
      1,
      DOCS_FLEX_TRACK,
      1,
      DOCS_SIDEBAR_WIDTH,
      1,
    ],
    rows: [1, DOCS_FLEX_TRACK, 1],
    areas: [
      '. . . . . . .',
      '. nav . main . meta .',
      '. . . . . . .',
    ],
    gap: 0,
    cells: { nav, main, meta },
  };
}
