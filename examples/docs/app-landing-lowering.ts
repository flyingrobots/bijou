import type { OutputMode, Surface } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { proseSurface } from '../_shared/example-surfaces.js';
import { VERSION_TEXT } from './app-ids.js';
import { dogfoodText } from './app-localization.js';
import { renderDogfoodReleaseTitleText } from './release-title.js';

/** Preserve release meaning and navigation text without the interactive artwork. */
export function renderLoweredLanding(mode: OutputMode, width: number, localization: LocalizationPort): Surface {
  const output = [
    renderDogfoodReleaseTitleText({ mode, width, localization }),
    VERSION_TEXT,
    dogfoodText(localization, 'landing.prompt.enter', 'Press [Enter]'),
  ].join('\n\n');
  return proseSurface(output, Math.max(1, width));
}
