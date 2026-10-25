import { contrastRatio } from './app-landing-colors.js';
import type { LandingThemeTokens } from './app-landing-types.js';

/** Decorative ink stays close to the surface; the logo owns the strong contrast. */
export function landingBackdropInkRamp(tokens: LandingThemeTokens): readonly string[] {
  const candidates = tokens.waveRamp.map((color) => ({ color, ratio: contrastRatio(color, tokens.background) }));
  return Array.from({ length: 16 }, (_, index) => {
    const limit = 1.08 + (1.45 - 1.08) * index / 15;
    let best = { color: tokens.background, ratio: 1 };
    for (const candidate of candidates) {
      if (candidate.ratio <= limit && candidate.ratio > best.ratio) best = candidate;
    }
    return best.color;
  });
}

/** A soft ellipse follows the bounded title viewport, creating space around the letters. */
export function landingBackdropInkIndex(x: number, y: number, width: number, height: number): number {
  if (width < 40 || height < 14) return 15;
  const radiusX = Math.min(width - 4, 180) * 0.55;
  const radiusY = Math.min(Math.floor(height * 0.6), 36) * 0.6;
  const distance = Math.hypot((x - width / 2) / radiusX, (y - height * 0.3) / radiusY);
  const t = Math.max(0, Math.min(1, (distance - 0.55) / 0.8));
  return Math.round(t * t * (3 - 2 * t) * 15);
}
