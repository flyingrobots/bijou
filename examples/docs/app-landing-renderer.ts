import { readFileSync } from 'node:fs';
import { compositeSurface, renderFramePerfHudOverlay, toast } from '../../packages/bijou-tui/src/index.js';
import type { Surface } from '../../packages/bijou/src/index.js';
import { paintLandingBackground, prepareLandingSurface } from './app-landing-background.js';
import {
  createLandingPromptSurface,
  getLandingFpsBadge,
  getLandingStaticSurfaces,
} from './app-landing-footer.js';
import { getLandingDogfoodPanel } from './app-landing-panel.js';
import {
  placeFooterBadges,
  placeLandingCluster,
} from './app-landing-layout.js';
import {
  quantizeLandingFps,
  resolveLandingQuality,
  resolveLandingQualityMode,
} from './app-landing-quality.js';
import { paintV7TitleArt } from './app-landing-title-art.js';
import {
  createWordmarkSurface,
  fitGlyphLinesToWidth,
  splitGlyphLines,
  transparentLogoGlyphs,
} from './app-landing-text.js';
import { resolveLandingTheme } from './app-landing-themes.js';
import type {
  LandingFrameCache,
  LandingModel,
  LandingPerfHudModel,
  LandingPerfHudOptions,
  LandingRendererOptions,
} from './app-landing-types-internal.js';

const FLYING_ROBOTS_LOGO_LINES = splitGlyphLines(readFileSync(
  new URL('../../assets/flyingrobotslogo.txt', import.meta.url),
  'utf8',
).trimEnd());

export function createLandingRenderer(options: LandingRendererOptions): (model: LandingModel) => Surface {
  const cache: LandingFrameCache = {};
  const { getCtx, localization, textModifiers, versionText } = options;

  return (model: LandingModel): Surface => {
    const ctx = getCtx();
    const width = Math.max(1, model.columns);
    const height = Math.max(1, model.rows);
    const tokens = resolveLandingTheme(model.landingThemeIndex);
    const qualityMode = resolveLandingQualityMode(model);
    const quality = resolveLandingQuality(width, height, qualityMode);
    const quantizedTimeMs = Math.floor(model.landingTimeMs / quality.frameStepMs) * quality.frameStepMs;
    const fpsBadgeValue = quantizeLandingFps(quality, model.landingFps);
    const activeToast = model.landingToast != null && model.landingTimeMs < model.landingToast.expiresAtMs
      ? model.landingToast
      : undefined;
    const cacheKey = [
      width,
      height,
      tokens.id,
      qualityMode,
      quality.id,
      quantizedTimeMs,
      fpsBadgeValue,
      activeToast?.message ?? '',
    ].join(':');
    if (cache.key === cacheKey && cache.front != null) return cache.front;

    const surface = prepareLandingSurface(cache.back, width, height, tokens.background);
    paintLandingBackground(surface, quantizedTimeMs, tokens, quality, textModifiers);
    paintV7TitleArt(surface, tokens, textModifiers, quantizedTimeMs);

    const wordmarkGlyphs = transparentLogoGlyphs(fitGlyphLinesToWidth(FLYING_ROBOTS_LOGO_LINES, Math.max(1, width - 4)));
    const wordmark = createWordmarkSurface(wordmarkGlyphs, textModifiers);
    const staticSurfaces = getLandingStaticSurfaces(tokens, localization, textModifiers, versionText);
    const promptLine = createLandingPromptSurface(tokens, textModifiers, quantizedTimeMs, localization);
    const fpsBadge = getLandingFpsBadge(tokens, fpsBadgeValue, quality, qualityMode, textModifiers, localization);
    const dogfoodPanel = getLandingDogfoodPanel(Math.max(28, Math.min(width - 6, 88)), ctx, tokens, textModifiers, localization);
    const footerY = Math.max(0, height - 1);
    const contentTop = Math.min(height - 1, Math.max(1, Math.floor(height * 0.68)));
    const contentBottom = Math.max(contentTop, footerY - 2);
    const availableHeight = Math.max(0, contentBottom - contentTop + 1);
    const fullClusterHeight = dogfoodPanel.height + promptLine.height + wordmark.height + 2;
    const compactClusterHeight = dogfoodPanel.height + promptLine.height + 1;

    placeLandingCluster(surface, dogfoodPanel, promptLine, wordmark, {
      availableHeight,
      contentBottom,
      contentTop,
      fullClusterHeight,
      compactClusterHeight,
      tokens,
      timeMs: quantizedTimeMs,
      modifiers: textModifiers,
    });
    surface.blit(staticSurfaces.footerControls, 0, footerY);
    placeFooterBadges(surface, staticSurfaces.footerControls.width, staticSurfaces.footerVersion, fpsBadge, footerY);

    const output = activeToast != null
      ? compositeSurface(surface, [toast({ message: activeToast.message, variant: 'info', anchor: 'top-right', screenWidth: width, screenHeight: height, ctx })])
      : surface;
    cache.key = cacheKey;
    cache.back = cache.front;
    cache.front = output;
    return output;
  };
}

export function renderLandingPerfHudOverlay(model: LandingPerfHudModel, options: LandingPerfHudOptions) {
  return renderFramePerfHudOverlay({
    columns: model.columns,
    rows: model.rows,
    frameTimeMs: model.docsModel.frameTimeMs,
    viewTimeMs: model.docsModel.viewTimeMs,
    diffTimeMs: model.docsModel.diffTimeMs,
    refreshRate: options.ctx.runtime.refreshRate,
  }, {
    i18n: options.i18n,
    ctx: options.ctx,
  });
}
