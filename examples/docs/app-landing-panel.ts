import {
  boxSurface,
  wrapToWidth,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { titleScreenBlock } from './dogfood-blocks.js';
import { dogfoodLocalizedText } from './localization.js';
import { CURRENT_DOGFOOD_RELEASE_TITLE } from './release-title.js';
import { pickStandoutColor, sampleColorRamp } from './app-landing-colors.js';
import { centerSurfaceHorizontally, createTransparentTextSurface } from './app-landing-text.js';
import type {
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

const LANDING_DOGFOOD_PANEL_CACHE = new Map<string, Surface>();

function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function getLandingDogfoodPanel(
  width: number,
  ctx: BijouContext,
  tokens: LandingThemeTokens,
  modifiers: LandingTextModifiers,
  localization?: LocalizationPort,
): Surface {
  const title = dogfoodText(localization, 'landing.dogfood.title', 'DOGFOOD');
  const expansion = dogfoodText(
    localization,
    'landing.dogfood.expansion',
    'Documentation Of Good Foundational Onboarding and Discovery',
  );
  const releaseTitle = dogfoodText(
    localization,
    CURRENT_DOGFOOD_RELEASE_TITLE.titleKey,
    CURRENT_DOGFOOD_RELEASE_TITLE.title,
  );
  const renderedTitle = titleScreenBlock.render({
    config: { title: `${title} / ${releaseTitle}`, subtitle: expansion },
    mode: 'interactive',
  });
  const [panelTitle = title, panelBody = expansion] = renderedTitle.output.split('\n');
  const key = `${tokens.id}:${String(width)}:${panelTitle}:${panelBody}`;
  const cached = LANDING_DOGFOOD_PANEL_CACHE.get(key);
  if (cached) return cached;

  const bodyWidth = Math.max(18, width - 4);
  const body = centerSurfaceHorizontally(createTransparentTextSurface(
    wrapToWidth(panelBody, bodyWidth).join('\n'),
    {
      bg: tokens.background,
      transparentSpaces: false,
      fg: tokens.footerStrongColor,
      modifiers: modifiers.bold,
    },
  ), bodyWidth);
  const surface = boxSurface(body, {
    title: panelTitle,
    width,
    borderToken: landingDogfoodPanelBorderToken(tokens),
    bgToken: { hex: tokens.footerStrongColor, bg: tokens.background },
    padding: { left: 1, right: 1 },
    ctx,
  });
  LANDING_DOGFOOD_PANEL_CACHE.set(key, surface);
  return surface;
}

function landingDogfoodPanelBorderToken(theme: LandingThemeTokens): TokenValue {
  return {
    hex: pickStandoutColor(theme.background, theme.footerMutedColor, [
      theme.footerStrongColor,
      sampleColorRamp(theme.logoRamp, 0.84),
      sampleColorRamp(theme.waveRamp, 0.78),
    ]),
    bg: theme.background,
  };
}
