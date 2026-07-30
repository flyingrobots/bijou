import {
  inspector,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { browsableListSurface } from '../../packages/bijou-tui/src/index.js';
import {
  column,
  contentSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import {
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
} from '../_stories/protocol.js';
import {
  docsThemeMutedBorderToken,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';
import type { LandingThemeTokens } from './app-landing.js';
import { adjustScroll } from './app-list-state.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { paragraphSurface } from './app-paragraph-surface.js';
import {
  selectedStory,
  selectedVariantIndex,
} from './app-story-catalog.js';
import { boxSurface } from '../../packages/bijou/src/index.js';

export function renderVariantsPane(
  model: DocsExplorerModel,
  width: number,
  height: number,
  context: BijouContext,
  theme: LandingThemeTokens,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const story = selectedStory(model);
  if (story == null) {
    return insetPaneSurface(
      column([
        themedSeparatorSurface('variants', paneWidth, context, theme),
        spacer(1, 1),
        boxSurface(
          paragraphSurface(
            'Variants appear here once a component is selected.',
            Math.max(20, paneWidth - 6),
          ),
          {
            width: Math.max(22, paneWidth),
            borderToken: docsThemeMutedBorderToken(theme),
            padding: { left: 1, right: 1 },
            ctx: context,
          },
        ),
      ]),
      width,
    );
  }
  const currentIndex = selectedVariantIndex(model, story.id);
  const items = story.variants.map((variant) => ({
    label: variant.label,
    value: variant.id,
  }));
  const listHeight = Math.max(
    3,
    Math.min(items.length, Math.max(3, height - 12)),
  );
  const list = browsableListSurface(
    {
      items,
      focusIndex: currentIndex,
      scrollY: adjustScroll(currentIndex, 0, listHeight, items.length),
      height: listHeight,
    },
    {
      width: Math.max(1, paneWidth),
      showScrollbar: items.length > listHeight,
      ctx: context,
    },
  );
  const variant = resolveStoryVariant(story, currentIndex);
  const description = contentSurface(
    inspector({
      title: 'active variant',
      currentValue: variant.label,
      sections: [
        {
          title: 'Profile',
          content: resolveStoryProfilePreset(
            story,
            findStoryProfileIndex(story, model.profileMode),
          ).label,
        },
        {
          title: 'Description',
          content:
            variant.description ?? 'No extra description for this variant.',
          tone: 'muted',
        },
      ],
      width: Math.max(22, paneWidth),
      borderToken: docsThemeMutedBorderToken(theme),
      bgToken: docsThemeSurfaceToken(theme),
      ctx: context,
    }),
  );
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        `variants • ${story.title}`,
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      list,
      spacer(1, 1),
      description,
    ]),
    width,
  );
}
