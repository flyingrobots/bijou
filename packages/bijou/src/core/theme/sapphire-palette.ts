import { normalizeHue, oklchToRgb } from './color-perceptual.part01.js';
import { gamutRelativeOklch as relativeOklch } from './color-perceptual.part02.js';
import { rgbToHex } from './color.part01.js';

export const SAPPHIRE_HUE = 255;

export interface SapphirePaletteSeed {
  readonly brandHue: number;
  readonly lightSurfaceHue: number;
}

export interface SapphireReferencePalette {
  readonly mode: 'dark' | 'light';
  readonly seed: SapphirePaletteSeed;
  readonly ink: Readonly<Record<'primary' | 'secondary' | 'elevated' | 'muted', string>>;
  readonly brand: Readonly<Record<'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info', string>>;
  readonly surfaceBase: Readonly<Record<'primary' | 'secondary' | 'elevated' | 'overlay' | 'muted', string>>;
  readonly borderBase: Readonly<Record<'muted' | 'scrollTrack', string>>;
  readonly uiBase: Readonly<Record<'trackEmpty', string>>;
}

const DEFAULT_SEED: SapphirePaletteSeed = Object.freeze({
  brandHue: SAPPHIRE_HUE,
  lightSurfaceHue: 85,
});

function resolveSeed(seed: Partial<SapphirePaletteSeed>): SapphirePaletteSeed {
  const resolved = {
    brandHue: seed.brandHue ?? DEFAULT_SEED.brandHue,
    lightSurfaceHue: seed.lightSurfaceHue ?? DEFAULT_SEED.lightSurfaceHue,
  };
  if (!Number.isFinite(resolved.brandHue) || !Number.isFinite(resolved.lightSurfaceHue)) {
    throw new Error('Sapphire palette hue seeds must be finite numbers');
  }
  return Object.freeze(resolved);
}

function hex(lightness: number, relativeChroma: number, hue: number): string {
  return rgbToHex(oklchToRgb(relativeOklch(lightness, relativeChroma, hue)));
}

function statusHues(brandHue: number) {
  return {
    success: normalizeHue(brandHue - 110),
    warning: normalizeHue(brandHue - 175),
    error: normalizeHue(brandHue + 130),
    info: normalizeHue(brandHue + 35),
  };
}

function darkPalette(seed: SapphirePaletteSeed): SapphireReferencePalette {
  const hue = seed.brandHue;
  const status = statusHues(hue);
  return Object.freeze({
    mode: 'dark',
    seed,
    ink: {
      primary: hex(0.93, 0.08, hue),
      secondary: hex(0.82, 0.1, hue),
      elevated: hex(0.97, 0.04, hue),
      muted: hex(0.68, 0.12, hue),
    },
    brand: {
      primary: hex(0.72, 0.55, hue),
      accent: hex(0.7, 1, hue),
      success: hex(0.72, 1, status.success),
      warning: hex(0.78, 1, status.warning),
      error: hex(0.68, 1, status.error),
      info: hex(0.74, 0.75, status.info),
    },
    surfaceBase: {
      primary: hex(0.16, 0.12, hue),
      secondary: hex(0.205, 0.15, hue),
      elevated: hex(0.25, 0.18, hue),
      overlay: hex(0.12, 0.1, hue),
      muted: hex(0.145, 0.1, hue),
    },
    borderBase: {
      muted: hex(0.58, 0.14, hue),
      scrollTrack: hex(0.55, 0.12, hue),
    },
    uiBase: { trackEmpty: hex(0.27, 0.14, hue) },
  });
}

function lightPalette(seed: SapphirePaletteSeed): SapphireReferencePalette {
  const hue = seed.brandHue;
  const surfaceHue = seed.lightSurfaceHue;
  const status = statusHues(hue);
  return Object.freeze({
    mode: 'light',
    seed,
    ink: {
      primary: hex(0.25, 0.12, hue),
      secondary: hex(0.32, 0.1, hue),
      elevated: hex(0.2, 0.08, hue),
      muted: hex(0.45, 0.13, hue),
    },
    brand: {
      primary: hex(0.47, 0.75, hue),
      accent: hex(0.43, 0.92, hue),
      success: hex(0.42, 0.68, status.success),
      warning: hex(0.44, 0.68, status.warning),
      error: hex(0.44, 0.7, status.error),
      info: hex(0.46, 0.62, status.info),
    },
    surfaceBase: {
      primary: hex(0.97, 0.1, surfaceHue),
      secondary: hex(0.93, 0.14, surfaceHue),
      elevated: hex(0.99, 0.05, surfaceHue),
      overlay: hex(0.95, 0.12, surfaceHue),
      muted: hex(0.92, 0.1, surfaceHue),
    },
    borderBase: {
      muted: hex(0.52, 0.12, hue),
      scrollTrack: hex(0.49, 0.16, hue),
    },
    uiBase: { trackEmpty: hex(0.87, 0.1, surfaceHue) },
  });
}

/**
 * Generate the inspectable reference colors behind a first-party Bijou mode.
 * Partial seeds support deterministic design exploration without changing the
 * semantic token topology.
 */
export function createSapphireReferencePalette(
  mode: 'dark' | 'light',
  seed: Partial<SapphirePaletteSeed> = {},
): SapphireReferencePalette {
  const resolved = resolveSeed(seed);
  return mode === 'dark' ? darkPalette(resolved) : lightPalette(resolved);
}
