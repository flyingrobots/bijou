import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { FrameLayoutNode } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { docsThemeUnfocusedGutterToken } from './app-docs-theme-tokens.js';
import { renderFamiliesPane } from './app-family-pane.js';
import { CONTEXT_DRAWER_PANE_ID } from './app-context-drawer.js';
import { createDocsShellLayout } from './app-docs-shell-layout.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import { renderStoryPane } from './app-story-pane.js';
import { renderVariantsPane } from './app-variants-pane.js';

export function createComponentsPageLayout(
  model: DocsExplorerModel,
  theme: LandingThemeTokens,
  getContext: () => BijouContext,
  localization: LocalizationPort,
): FrameLayoutNode {
  const family: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'family-nav',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) =>
      renderFamiliesPane(model, width, height, getContext(), theme),
  };
  const main: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'story-content',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width) =>
      renderStoryPane(
        model,
        width,
        getContext(),
        theme,
        localization,
      ),
  };
  const variants: FrameLayoutNode = {
    kind: 'pane',
    paneId: 'story-variants',
    unfocusedGutterToken: docsThemeUnfocusedGutterToken(theme),
    render: (width, height) =>
      renderVariantsPane(model, width, height, getContext(), theme),
  };
  const drawer: FrameLayoutNode = {
    ...variants,
    paneId: CONTEXT_DRAWER_PANE_ID,
  };
  return createDocsShellLayout(
    'docs-shell',
    model.layoutVariant,
    model.contextDrawer.open,
    { side: family, main, aside: variants, drawer },
  );
}
