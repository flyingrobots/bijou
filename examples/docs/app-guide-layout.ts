import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { FrameLayoutNode } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { docsThemeUnfocusedGutterToken } from './app-docs-theme-tokens.js';
import { renderGuideInfoPane } from './app-guide-info-pane.js';
import { renderGuideNavPane } from './app-guide-nav-pane.js';
import { renderGuideReaderPane } from './app-guide-reader-pane.js';
import { CONTEXT_DRAWER_PANE_ID } from './app-context-drawer.js';
import { createDocsShellLayout } from './app-docs-shell-layout.js';
import type { DocsPageId } from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';

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
  const drawer: FrameLayoutNode = {
    ...meta,
    paneId: CONTEXT_DRAWER_PANE_ID,
  };
  return createDocsShellLayout(
    `docs-${pageId}`,
    model.layoutVariant,
    model.contextDrawer.open,
    { side: nav, main, aside: meta, drawer },
  );
}
