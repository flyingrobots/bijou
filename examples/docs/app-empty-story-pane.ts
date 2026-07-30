import {
  boxSurface,
  progressBar,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  contentSurface,
  line,
  spacer,
} from '../_shared/example-surfaces.js';
import type { LandingThemeTokens } from './app-landing.js';
import {
  docsThemeBorderToken,
  docsThemeProgressTokens,
} from './app-docs-theme-tokens.js';
import { dogfoodText } from './app-localization.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { paragraphSurface } from './app-paragraph-surface.js';
import { DOGFOOD_DOCS_COVERAGE } from './app-story-catalog.js';
import { renderEmptyStoryUsageGuide } from './app-empty-story-guide.js';

export function renderEmptyStoryPane(
  width: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const bodyWidth = Math.max(28, paneWidth - 6);
  const paragraphWidth = Math.max(24, bodyWidth - 2);
  const intro = boxSurface(
    column([
      paragraphSurface(
        dogfoodText(
          localization,
          'docs.empty.intro.body',
          'Bijou is a surface-native terminal UI framework for building styled, stateful, testable TUIs without dropping back into stringly view code.',
        ),
        paragraphWidth,
      ),
      spacer(),
      paragraphSurface(
        dogfoodText(
          localization,
          'docs.empty.intro.body2',
          'DOGFOOD is the living field guide for the framework. The docs, previews, shell, and teaching surfaces are built in Bijou itself so the documentation exercises the same runtime and design system it describes.',
        ),
        paragraphWidth,
      ),
    ]),
    {
      title: dogfoodText(
        localization,
        'docs.empty.intro.title',
        'What is Bijou?',
      ),
      width: Math.max(24, paneWidth),
      borderToken: docsThemeBorderToken(theme),
      padding: { left: 1, right: 1 },
      ctx: context,
    },
  );
  const coverage = boxSurface(
    column([
      paragraphSurface(
        dogfoodText(
          localization,
          'docs.empty.coverage.body',
          'DOGFOOD currently documents {documented} of {total} canonical component families. This field guide is honest about current coverage and will keep expanding over time.',
          {
            documented: DOGFOOD_DOCS_COVERAGE.documentedFamilies,
            total: DOGFOOD_DOCS_COVERAGE.totalFamilies,
          },
        ),
        paragraphWidth,
      ),
      spacer(),
      contentSurface(
        progressBar(DOGFOOD_DOCS_COVERAGE.percent, {
          width: Math.max(16, Math.min(40, bodyWidth - 8)),
          showPercent: true,
          ...docsThemeProgressTokens(theme),
          ctx: context,
        }),
      ),
      spacer(),
      line(
        dogfoodText(
          localization,
          'docs.empty.coverage.status',
          '{documented}/{total} families • {percent}%',
          {
            documented: DOGFOOD_DOCS_COVERAGE.documentedFamilies,
            total: DOGFOOD_DOCS_COVERAGE.totalFamilies,
            percent: DOGFOOD_DOCS_COVERAGE.percent,
          },
        ),
      ),
    ]),
    {
      title: dogfoodText(
        localization,
        'docs.empty.coverage.title',
        'Documentation coverage',
      ),
      width: Math.max(24, paneWidth),
      borderToken: docsThemeBorderToken(theme),
      padding: { left: 1, right: 1 },
      ctx: context,
    },
  );
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        dogfoodText(
          localization,
          'docs.separator.welcome',
          'welcome to bijou',
        ),
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      intro,
      spacer(1, 1),
      coverage,
      spacer(1, 1),
      renderEmptyStoryUsageGuide(
        paneWidth,
        context,
        theme,
        localization,
      ),
    ]),
    width,
  );
}
