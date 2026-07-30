import {
  boxSurface,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, line } from '../_shared/example-surfaces.js';
import { docsThemeMutedBorderToken } from './app-docs-theme-tokens.js';
import type { LandingThemeTokens } from './app-landing.js';
import { dogfoodText } from './app-localization.js';

export function renderEmptyStoryUsageGuide(
  paneWidth: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const step = (id: string, fallback: string) =>
    line(dogfoodText(localization, id, fallback));
  return boxSurface(
    column([
      step(
        'docs.empty.guide.step1',
        '1. Browse component families in the left lane.',
      ),
      step(
        'docs.empty.guide.step2',
        '2. Press Enter to expand a family or open a component.',
      ),
      step(
        'docs.empty.guide.step3',
        '3. Use Tab to move focus between families, docs, and variants.',
      ),
      step(
        'docs.empty.guide.step4',
        '4. Press / to search documentation at any time.',
      ),
      step(
        'docs.empty.guide.step5',
        '5. Press F2 for settings, ? for help, and q or Esc to quit.',
      ),
    ]),
    {
      title: dogfoodText(
        localization,
        'docs.empty.guide.title',
        'How to use these docs',
      ),
      width: Math.max(24, paneWidth),
      borderToken: docsThemeMutedBorderToken(theme),
      padding: { left: 1, right: 1 },
      ctx: context,
    },
  );
}
