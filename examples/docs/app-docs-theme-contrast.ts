import { themeContrastRatio } from '../../packages/bijou/src/index.js';
import {
  pickStandoutColor,
  sampleColorRamp,
  type LandingThemeTokens,
} from './app-landing.js';

export const DOCS_READABLE_TEXT_RATIO = 7;
export const DOCS_BODY_TEXT_RATIO = 4.5;
export const DOCS_CHROME_RATIO = 3;

export function docsPanelBackground(theme: LandingThemeTokens): string {
  return sampleColorRamp(theme.waveRamp, 0.06);
}

export function docsReadableColor(
  theme: LandingThemeTokens,
  background: string,
  base: string,
  minRatio: number,
): string {
  return pickReadableColor(background, base, docsReadableCandidates(theme), minRatio);
}

export function pickReadableColor(
  background: string,
  base: string,
  candidates: readonly string[],
  minRatio: number,
): string {
  const readableCandidates = uniqueColors(candidates)
    .filter((candidate) => (themeContrastRatio(candidate, background) ?? 0) >= minRatio);
  return pickStandoutColor(
    background,
    base,
    readableCandidates.length > 0 ? readableCandidates : candidates,
  );
}

export function docsReadableCandidates(theme: LandingThemeTokens): readonly string[] {
  return [
    sampleColorRamp(theme.logoRamp, 0.98),
    sampleColorRamp(theme.logoRamp, 0.88),
    sampleColorRamp(theme.logoRamp, 0.72),
    sampleColorRamp(theme.logoRamp, 0.5),
    sampleColorRamp(theme.logoRamp, 0.28),
    sampleColorRamp(theme.logoRamp, 0.12),
    sampleColorRamp(theme.logoRamp, 0.02),
    sampleColorRamp(theme.waveRamp, 0.98),
    sampleColorRamp(theme.waveRamp, 0.88),
    sampleColorRamp(theme.waveRamp, 0.72),
    sampleColorRamp(theme.waveRamp, 0.5),
    sampleColorRamp(theme.waveRamp, 0.28),
    sampleColorRamp(theme.waveRamp, 0.12),
    sampleColorRamp(theme.waveRamp, 0.02),
    theme.background,
  ];
}

function uniqueColors(colors: readonly string[]): readonly string[] {
  return Array.from(new Set(colors));
}
