import {
  createSurface,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { clamp01, sampleColorRamp } from './app-landing-colors.js';
import type {
  LandingQualityProfile,
  LandingTextModifiers,
  LandingThemeTokens,
} from './app-landing-types.js';

const LANDING_WAKE_CHARS = ['█', '▓', '▒', '░', ' '] as const;
const LANDING_WAKE_WAVES = [
  { seeds: [0.15, 0.13, 0.37], amps: [10, 8, 5], scale: 0.9 },
  { seeds: [0.12, 0.14, 0.27], amps: [3, 6, 5], scale: 0.8 },
  { seeds: [0.089, 0.023, 0.217], amps: [2, 4, 2], scale: 0.3 },
  { seeds: [0.167, 0.054, 0.147], amps: [4, 6, 7], scale: 0.4 },
] as const;

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
  modifiers: LandingTextModifiers,
): void {
  const width = surface.width;
  const height = surface.height;
  const time = timeMs * 0.002;
  const widthDenominator = width - 1 || 1;
  const heightDenominator = height - 1 || 1;
  const tile = quality.backgroundTile;
  const amplitudeScale = Math.max(0.35, Math.min(1.4, width / 120));

  for (let tileY = 0; tileY < height; tileY += tile) {
    const sampleY = Math.min(height - 1, tileY + Math.floor(tile / 2));
    const v = sampleY / heightDenominator;
    for (let tileX = 0; tileX < width; tileX += tile) {
      const sampleX = Math.min(width - 1, tileX + Math.floor(tile / 2));
      const u = sampleX / widthDenominator;
      const layer = landingWakeLayer(sampleX, sampleY, width, time, amplitudeScale);
      const char = LANDING_WAKE_CHARS[layer] ?? ' ';
      if (char === ' ') continue;

      const level = 1 - (layer / (LANDING_WAKE_CHARS.length - 1));
      const colorT = clamp01(
        0.1
        + (layer * 0.16)
        + (u * 0.26)
        + (0.18 * (0.5 + (Math.sin((time * 0.9) + (v * 5.2)) * 0.5)))
        + (0.06 * Math.sin((time * 0.7) + (sampleX * 0.035))),
      );
      const bg = sampleColorRamp(tokens.waveRamp, colorT);
      const maxY = Math.min(height, tileY + tile);
      const maxX = Math.min(width, tileX + tile);

      for (let y = tileY; y < maxY; y++) {
        for (let x = tileX; x < maxX; x++) {
          surface.set(x, y, {
            char,
            bg,
            fg: bg,
            modifiers: level < 0.55 ? modifiers.dim : undefined,
            empty: false,
            opacity: 1,
          });
        }
      }
    }
  }
}

function landingWakeLayer(x: number, y: number, width: number, time: number, amplitudeScale: number): number {
  const edges: number[] = [];
  let edge = width / 4;

  for (const spec of LANDING_WAKE_WAVES) {
    edge += stackedWakeWave(time, y, spec.seeds, spec.amps) * spec.scale * amplitudeScale;
    edges.push(edge);
  }

  for (let index = edges.length - 1; index >= 0; index--) {
    const edgeThreshold = edges[index];
    if (edgeThreshold !== undefined && x > edgeThreshold) return index + 1;
  }

  return 0;
}

function stackedWakeWave(
  time: number,
  y: number,
  seeds: readonly [number, number, number],
  amps: readonly [number, number, number],
): number {
  return (
    ((Math.sin(time + (y * seeds[0])) + 1) * amps[0])
    + ((Math.sin(time + (y * seeds[1])) + 1) * amps[1])
    + (Math.sin(time + (y * seeds[2])) * amps[2])
  );
}
