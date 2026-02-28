/**
 * Color downsampling utilities for terminals with limited color support.
 *
 * Provides pure conversion functions for mapping RGB colors to lower
 * color levels (ANSI 256, ANSI 16) without external dependencies.
 */

export type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor';

// ---------------------------------------------------------------------------
// RGB → ANSI 256
// ---------------------------------------------------------------------------

/**
 * Map an RGB color to the nearest ANSI 256 color index (16–255).
 *
 * The ANSI 256 palette has:
 * - Indices 0–15: standard + bright colors (not targeted here)
 * - Indices 16–231: 6×6×6 color cube
 * - Indices 232–255: grayscale ramp (24 shades)
 */
export function rgbToAnsi256(r: number, g: number, b: number): number {
  // Check if it's close to grayscale first
  if (r === g && g === b) {
    if (r < 8) return 16;         // black end of cube
    if (r > 248) return 231;      // white end of cube
    return Math.round((r - 8) / 247 * 24) + 232;
  }

  // Map to 6×6×6 color cube (indices 16–231)
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + (36 * ri) + (6 * gi) + bi;
}

/**
 * Find the nearest ANSI 256 color using Euclidean distance in RGB space.
 *
 * Considers both the 6×6×6 cube and the grayscale ramp, returning
 * whichever is closest to the input color.
 */
export function nearestAnsi256(r: number, g: number, b: number): number {
  const cubeIdx = rgbToAnsi256(r, g, b);

  // Also check the grayscale ramp for a closer match
  let grayIdx = cubeIdx;
  if (r !== g || g !== b) {
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    if (gray < 8) {
      grayIdx = 16;
    } else if (gray > 248) {
      grayIdx = 231;
    } else {
      grayIdx = Math.round((gray - 8) / 247 * 24) + 232;
    }
  }

  if (cubeIdx === grayIdx) return cubeIdx;

  // Compare distances
  const cubeRgb = ansi256ToRgb(cubeIdx);
  const grayRgb = ansi256ToRgb(grayIdx);

  const cubeDist = colorDistance(r, g, b, cubeRgb[0], cubeRgb[1], cubeRgb[2]);
  const grayDist = colorDistance(r, g, b, grayRgb[0], grayRgb[1], grayRgb[2]);

  return grayDist < cubeDist ? grayIdx : cubeIdx;
}

/** Convert an ANSI 256 index (16–255) back to approximate RGB. */
function ansi256ToRgb(idx: number): [number, number, number] {
  if (idx >= 232) {
    const gray = (idx - 232) * 10 + 8;
    return [gray, gray, gray];
  }
  const value = idx - 16;
  const ri = Math.floor(value / 36);
  const gi = Math.floor((value % 36) / 6);
  const bi = value % 6;
  return [
    ri > 0 ? ri * 40 + 55 : 0,
    gi > 0 ? gi * 40 + 55 : 0,
    bi > 0 ? bi * 40 + 55 : 0,
  ];
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// ---------------------------------------------------------------------------
// RGB → ANSI 16
// ---------------------------------------------------------------------------

/**
 * The 16 standard ANSI colors in RGB, indexed 0–15.
 * 0–7: standard, 8–15: bright variants.
 */
const ANSI16_PALETTE: readonly [number, number, number][] = [
  [0, 0, 0],       // 0: black
  [128, 0, 0],     // 1: red
  [0, 128, 0],     // 2: green
  [128, 128, 0],   // 3: yellow
  [0, 0, 128],     // 4: blue
  [128, 0, 128],   // 5: magenta
  [0, 128, 128],   // 6: cyan
  [192, 192, 192], // 7: white (light gray)
  [128, 128, 128], // 8: bright black (dark gray)
  [255, 0, 0],     // 9: bright red
  [0, 255, 0],     // 10: bright green
  [255, 255, 0],   // 11: bright yellow
  [0, 0, 255],     // 12: bright blue
  [255, 0, 255],   // 13: bright magenta
  [0, 255, 255],   // 14: bright cyan
  [255, 255, 255], // 15: bright white
];

/**
 * Map an RGB color to the nearest ANSI 16 color index (0–15).
 *
 * Uses Euclidean distance in RGB space to find the closest match
 * among the 16 standard terminal colors.
 */
export function rgbToAnsi16(r: number, g: number, b: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < ANSI16_PALETTE.length; i++) {
    const [pr, pg, pb] = ANSI16_PALETTE[i]!;
    const dist = colorDistance(r, g, b, pr, pg, pb);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// ---------------------------------------------------------------------------
// ANSI 256 → ANSI 16
// ---------------------------------------------------------------------------

/**
 * Convert an ANSI 256 color index to the nearest ANSI 16 color index.
 */
export function ansi256ToAnsi16(code: number): number {
  // Standard colors pass through
  if (code < 16) return code;

  const [r, g, b] = ansi256ToRgb(code);
  return rgbToAnsi16(r, g, b);
}
