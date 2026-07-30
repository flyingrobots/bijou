import type {
  BijouContext,
  Surface,
} from '../../packages/bijou/src/index.js';
import { browsableListSurface } from '../../packages/bijou-tui/src/index.js';
import { column } from '../_shared/example-surfaces.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { parseRowValue } from './app-list-state.js';
import { STORY_FAMILIES } from './app-story-catalog.js';
import { findComponentStory } from './stories.js';
import { formatFamilyRow } from './app-row-format.js';
import {
  docsThemeAccentToken,
  docsThemeMutedBorderToken,
} from './app-docs-theme-tokens.js';

export function renderFamiliesPane(
  model: DocsExplorerModel,
  width: number,
  _height: number,
  context: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const body = browsableListSurface(model.familyState, {
    width: Math.max(1, paneWidth),
    showScrollbar: true,
    ctx: context,
    focusedRowOverflow: {
      mode: 'marquee',
      elapsedMs: model.previewTimeMs,
    },
    renderItem: ({ item, focused }) => {
      const rowValue = typeof item.value === 'string' ? item.value : '';
      return formatFamilyRow({
        row: parseRowValue(rowValue),
        focused,
        selectedStoryId: model.selectedStoryId,
        expandedFamilies: model.expandedFamilies,
        ctx: context,
        tokens: {
          accent: docsThemeAccentToken(theme),
          muted: docsThemeMutedBorderToken(theme),
        },
        findFamily: (familyId) =>
          STORY_FAMILIES.find((candidate) => candidate.id === familyId),
        findStory: findComponentStory,
      });
    },
  });
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        'component families',
        paneWidth,
        context,
        theme,
      ),
      body,
    ]),
    width,
  );
}
