import type { Surface } from '../../packages/bijou/src/index.js';
import { paintFlyingRobotsLogoOverlay } from './app-landing-logo-overlay.js';
import type {
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

export interface LandingClusterPlacement {
  readonly availableHeight: number;
  readonly contentBottom: number;
  readonly contentTop: number;
  readonly fullClusterHeight: number;
  readonly compactClusterHeight: number;
  readonly tokens: LandingThemeTokens;
  readonly timeMs: number;
  readonly modifiers: LandingTextModifiers;
}

export function placeLandingCluster(
  surface: Surface,
  dogfoodPanel: Surface,
  promptLine: Surface,
  wordmark: Surface,
  placement: LandingClusterPlacement,
): void {
  if (placement.availableHeight >= placement.fullClusterHeight) {
    const startY = placement.contentTop + Math.max(0, Math.floor((placement.availableHeight - placement.fullClusterHeight) / 2));
    blitCentered(surface, dogfoodPanel, startY);
    blitCentered(surface, promptLine, startY + dogfoodPanel.height + 1);
    paintFlyingRobotsLogoOverlay(
      surface,
      wordmark,
      startY + dogfoodPanel.height + promptLine.height + 2,
      placement.tokens,
      placement.modifiers,
      placement.timeMs,
    );
    return;
  }
  if (placement.availableHeight >= placement.compactClusterHeight) {
    const startY = placement.contentTop + Math.max(0, Math.floor((placement.availableHeight - placement.compactClusterHeight) / 2));
    blitCentered(surface, dogfoodPanel, startY);
    blitCentered(surface, promptLine, startY + dogfoodPanel.height + 1);
    return;
  }
  const promptY = Math.max(0, Math.min(placement.contentBottom - promptLine.height + 1, placement.contentTop));
  blitCentered(surface, promptLine, promptY);
  if (placement.availableHeight >= dogfoodPanel.height) blitCentered(surface, dogfoodPanel, placement.contentTop);
}

export function placeFooterBadges(
  surface: Surface,
  controlsWidth: number,
  footerVersion: Surface,
  fpsBadge: Surface,
  footerY: number,
): void {
  const footerVersionX = Math.max(0, surface.width - footerVersion.width);
  const footerBadgeX = Math.floor((surface.width - fpsBadge.width) / 2);
  const footerBadgeMinX = controlsWidth + 2;
  const footerBadgeMaxX = footerVersionX - fpsBadge.width - 2;
  if (footerBadgeMinX <= footerBadgeMaxX) {
    surface.blit(fpsBadge, Math.max(footerBadgeMinX, Math.min(footerBadgeX, footerBadgeMaxX)), footerY);
  }
  surface.blit(footerVersion, footerVersionX, footerY);
}

function blitCentered(surface: Surface, content: Surface, y: number): void {
  surface.blit(content, Math.max(0, Math.floor((surface.width - content.width) / 2)), y);
}
