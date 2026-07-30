import {
  inspector,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  contentSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import {
  docsThemeMutedBorderToken,
  docsThemeSurfaceToken,
} from './app-docs-theme-tokens.js';
import {
  guideDocSummary,
  guideDocTitle,
} from './app-guide-access.js';
import { selectedGuide } from './app-guide-navigation.js';
import { guidePosture } from './app-guide-posture.js';
import type { DocsPageId } from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import { dogfoodText } from './app-localization.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { pageTitle } from './app-page-title.js';
import { guideInspectorBlock } from './dogfood-blocks.js';

export function renderGuideInfoPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const doc = selectedGuide(pageId, model);
  const selectedTitle =
    doc == null
      ? pageTitle(pageId, localization)
      : guideDocTitle(doc, localization);
  const description =
    doc == null
      ? dogfoodText(
          localization,
          'guide.info.defaultSummary',
          'This section is still being expanded.',
        )
      : guideDocSummary(doc, localization);
  const sections = [
    {
      title: dogfoodText(
        localization,
        'guide.info.summaryTitle',
        'Summary',
      ),
      content: description,
      tone: 'muted' as const,
    },
    {
      title: dogfoodText(
        localization,
        'guide.info.currentPostureTitle',
        'Current posture',
      ),
      content: guidePosture(pageId, localization),
      tone: 'muted' as const,
    },
  ];
  const lowered = guideInspectorBlock.render({
    config: { selectionLabel: selectedTitle, sections },
    mode: context.mode,
  });
  const inspectorSections =
    context.mode === 'interactive' || context.mode === 'static'
      ? sections
      : [
          {
            title: 'GuideInspectorBlock',
            content: lowered.output,
            tone: 'muted' as const,
          },
        ];
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        `section • ${pageTitle(pageId, localization).toLowerCase()}`,
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      contentSurface(
        inspector({
          title: dogfoodText(
            localization,
            'guide.info.title',
            'guide info',
          ),
          currentValue: selectedTitle,
          sections: inspectorSections,
          width: Math.max(22, paneWidth),
          borderToken: docsThemeMutedBorderToken(theme),
          bgToken: docsThemeSurfaceToken(theme),
          ctx: context,
        }),
      ),
    ]),
    width,
  );
}
