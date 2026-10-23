import {
  createSurface,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { sampleColorRamp } from './app-landing-colors.js';
import { landingNoiseDensity } from './app-landing-noise.js';
import type {
  LandingQualityProfile,
  LandingThemeTokens,
} from './app-landing-types.js';

// Character-density field inspired by https://github.com/Koalhack/PerlinASCII.
const LANDING_NOISE_CHARS = ' .,-~:;=!*#$@';

export function prepareLandingSurface(
  scratch: Surface | undefined,
  width: number,
  height: number,
  background: string,
): Surface {
  const surface = scratch?.width === width && scratch.height === height
    ? scratch
    : createSurface(width, height, { char: ' ', bg: background, empty: false });
  surface.fill({ char: ' ', bg: background, empty: false, fg: undefined, modifiers: undefined, opacity: 1 });
  return surface;
}

export function paintLandingBackground(
  surface: Surface,
  timeMs: number,
  tokens: LandingThemeTokens,
  quality: LandingQualityProfile,
): void {
  const { width, height } = surface;
  const tile = Math.max(1, Math.floor(quality.backgroundTile));
  const foreground = sampleColorRamp(tokens.waveRamp, 0.72);
  for (let tileY = 0; tileY < height; tileY += tile) {
    const sampleY = Math.min(height - 1, tileY + Math.floor(tile / 2));
    for (let tileX = 0; tileX < width; tileX += tile) {
      const sampleX = Math.min(width - 1, tileX + Math.floor(tile / 2));
      const density = landingNoiseDensity(sampleX, sampleY, timeMs);
      const char = LANDING_NOISE_CHARS[Math.round(density * (LANDING_NOISE_CHARS.length - 1))] ?? ' ';
      for (let y = tileY; y < Math.min(height, tileY + tile); y++) {
        for (let x = tileX; x < Math.min(width, tileX + tile); x++) {
          surface.set(x, y, {
            char, fg: foreground, bg: tokens.background, empty: false, opacity: 1,
          });
        }
      }
    }
  }
}
