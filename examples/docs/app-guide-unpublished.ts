import {
  boxSurface,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column, spacer } from '../_shared/example-surfaces.js';
import { docsThemeMutedBorderToken } from './app-docs-theme-tokens.js';
import type { LandingThemeTokens } from './app-landing.js';
import { dogfoodText } from './app-localization.js';
import {
  insetPaneSurface,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { paragraphSurface } from './app-paragraph-surface.js';

export function renderUnpublishedGuide(
  width: number,
  paneWidth: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        dogfoodText(localization, 'docs.reader.separator', 'docs'),
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      boxSurface(
        paragraphSurface(
          dogfoodText(
            localization,
            'docs.reader.unpublished',
            'This section does not have published docs yet.',
          ),
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
