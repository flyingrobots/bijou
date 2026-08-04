import {
  alert,
  badge,
  cloneContextWithTheme,
  progressBar,
  separator,
  type BijouContext,
  type Surface,
  type Theme,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  contentSurface,
  row,
  screenSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import { dogfoodText } from './app-theme-lab-provenance-contract.js';

const PREVIEW_PROGRESS_PERCENT = 61;
const PREVIEW_SEPARATOR_MAX = 44;

function badgeRow(ctx: BijouContext, localization: LocalizationPort | undefined): Surface {
  // Variants passed as `variant:` fields rather than positionally, so the
  // localization scanner reads them as the role identifiers they are.
  return row([
    badge(dogfoodText(localization, 'themeLab.preview.success', 'SUCCESS'), { variant: 'success', ctx }), ' ',
    badge(dogfoodText(localization, 'themeLab.preview.warning', 'WARNING'), { variant: 'warning', ctx }), ' ',
    badge(dogfoodText(localization, 'themeLab.preview.error', 'ERROR'), { variant: 'error', ctx }), ' ',
    badge(dogfoodText(localization, 'themeLab.preview.info', 'INFO'), { variant: 'info', ctx }), ' ',
    badge(dogfoodText(localization, 'themeLab.preview.accent', 'ACCENT'), { variant: 'accent', ctx }),
  ]);
}

/**
 * Render real components under the draft theme.
 *
 * The rest of the Theme Lab reports a theme as numbers — hexes, ratios, token
 * paths. None of that answers "what does this look like", and a palette whose
 * roles have quietly collapsed onto one colour still reads as a tidy list of
 * swatches. This panel draws the components themselves, so an edit changes the
 * picture rather than a column of values.
 *
 * The badge row is deliberately ordered success / warning / error / info /
 * accent: those five must stay tellable apart at a glance, and this is where
 * a collision between them becomes obvious.
 */
export function renderThemeLabPreviewSurface(
  draftTheme: Theme,
  ctx: BijouContext,
  width: number,
  localization?: LocalizationPort,
): Surface {
  // Every component below resolves through this context, so the preview shows
  // the draft as it would actually render rather than as the shell renders.
  const themed = cloneContextWithTheme(ctx, draftTheme);
  const inner = Math.max(20, Math.min(width - 2, PREVIEW_SEPARATOR_MAX));

  // Deliberately compact. Every row spent here is a row the editor and the
  // token graph lose, and this pane has to share one screen with both.
  const body = column([
    badgeRow(themed, localization),
    spacer(1, 1),
    contentSurface(alert(
      dogfoodText(localization, 'themeLab.preview.alertWarning', 'Two advisories remain open.'),
      { variant: 'warning', ctx: themed },
    )),
    spacer(1, 1),
    contentSurface(progressBar(PREVIEW_PROGRESS_PERCENT, {
      width: inner,
      showPercent: true,
      ctx: themed,
    })),
    contentSurface(separator({
      label: dogfoodText(localization, 'themeLab.preview.separator', 'preview'),
      width: inner,
      ctx: themed,
    })),
  ]);

  return screenSurface(width, body.height, body);
}
