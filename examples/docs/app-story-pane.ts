import {
  boxSurface,
  markdown,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { placeSurface } from '../../packages/bijou-tui/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  proseSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import {
  createStoryProfileContext,
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
} from '../_stories/protocol.js';
import {
  docsThemeMutedBorderToken,
} from './app-docs-theme-tokens.js';
import { renderEmptyStoryPane } from './app-empty-story-pane.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import {
  selectedStory,
  selectedVariantIndex,
} from './app-story-catalog.js';

export function renderStoryPane(
  model: DocsExplorerModel,
  width: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const story = selectedStory(model);
  if (story == null) {
    return renderEmptyStoryPane(width, context, theme, localization);
  }
  const paneWidth = resolvePaneInnerWidth(width);
  const preset = resolveStoryProfilePreset(
    story,
    findStoryProfileIndex(story, model.profileMode),
  );
  const variant = resolveStoryVariant(
    story,
    selectedVariantIndex(model, story.id),
  );
  const previewWidth = Math.max(
    20,
    Math.min(Math.max(20, paneWidth - 6), preset.width),
  );
  const previewContext = createStoryProfileContext(context, preset, {
    width: previewWidth,
    height: 14,
  });
  const preview = storyPreviewSurface(
    variant.render({
      width: previewWidth,
      ctx: previewContext,
      state: variant.initialState,
      timeMs: model.previewTimeMs,
    }),
  );
  const previewTitle = `live preview • ${preset.label} • ${variant.label}`;
  const previewCard = boxSurface(preview, {
    title: previewTitle,
    width: Math.min(
      paneWidth,
      Math.max(28, preview.width + 4, previewTitle.length + 4),
    ),
    borderToken: docsThemeMutedBorderToken(theme),
    padding: { left: 1, right: 1 },
    ctx: context,
  });
  const docsWidth = Math.max(24, paneWidth - 2);
  const docs = markdown(storyDocsMarkdown(story, variant, preset), {
    width: docsWidth,
    ctx: context,
  });
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        `docs • ${story.title}`,
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      placeSurface(previewCard, {
        width: paneWidth,
        height: previewCard.height,
        hAlign: 'center',
        vAlign: 'top',
      }),
      spacer(1, 1),
      proseSurface(docs, docsWidth),
    ]),
    width,
  );
}
