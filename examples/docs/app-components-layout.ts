import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { FrameLayoutNode } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { docsThemeUnfocusedGutterToken } from './app-docs-theme-tokens.js';
import { renderFamiliesPane } from './app-family-pane.js';
import {
  DOCS_FLEX_TRACK,
  DOCS_SIDEBAR_WIDTH,
} from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import { docsNavWidthForVariant } from './app-pane-geometry.js';
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
  if (model.layoutVariant === 'tiny') return main;
  const navWidth = docsNavWidthForVariant(model.layoutVariant);
  if (model.layoutVariant !== 'wide') {
    return {
      kind: 'grid',
      gridId: 'docs-shell',
      columns:
        model.layoutVariant === 'narrow'
          ? [1, navWidth, 1, DOCS_FLEX_TRACK]
          : [1, navWidth, 1, DOCS_FLEX_TRACK, 1],
      rows: [1, DOCS_FLEX_TRACK, 1],
      areas:
        model.layoutVariant === 'narrow'
          ? ['. . . .', '. family . main', '. . . .']
          : ['. . . . .', '. family . main .', '. . . . .'],
      gap: 0,
      cells: { family, main },
    };
  }
  return {
    kind: 'grid',
    gridId: 'docs-shell',
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
      '. family . main . variants .',
      '. . . . . . .',
    ],
    gap: 0,
    cells: { family, main, variants },
  };
}
