

export type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor';
export function rgbToAnsi256(r: number, g: number, b: number): number {
  // Check if it's close to grayscale first
  if (r === g && g === b) {
    if (r < 8) return 16;         // black end of cube
    if (r > 248) return 231;      // white end of cube
    return Math.round((r - 8) / 247 * 24) + 232;
  }

  // Map to 6x6x6 color cube (indices 16-231)
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + (36 * ri) + (6 * gi) + bi;
}
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
export function ansi256ToRgb(idx: number): [number, number, number] {
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
export function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}
export const ANSI16_PALETTE: readonly [number, number, number][] = [
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
