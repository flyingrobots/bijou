import { createSurface } from '@flyingrobots/bijou';
import { GRAPH_SAMPLES } from './perf-model.js';

const samples = new Float64Array(GRAPH_SAMPLES);
let sampleHead = 0;
let sampleCount = 0;
const BRAILLE_BASE = 0x2800;
const DOT_LEFT = [0x01, 0x02, 0x04, 0x40] as const;
const DOT_RIGHT = [0x08, 0x10, 0x20, 0x80] as const;

export function pushViewTime(milliseconds: number): void {
  samples[sampleHead] = milliseconds;
  sampleHead = (sampleHead + 1) % GRAPH_SAMPLES;
  if (sampleCount < GRAPH_SAMPLES) sampleCount++;
}

export function viewTimeCount(): number {
  return sampleCount;
}

export function readViewTime(index: number): number {
  const resolved =
    (sampleHead - sampleCount + index + GRAPH_SAMPLES) % GRAPH_SAMPLES;
  return samples[resolved] ?? 0;
}

export function renderBrailleLineChart(
  surface: ReturnType<typeof createSurface>,
  x: number,
  y: number,
  width: number,
  height: number,
  maxValue: number,
  foreground: string,
  background: string,
  referenceForeground: string,
  referenceValue?: number,
): void {
  const dotHeight = height * 4;
  const dotWidth = width * 2;
  const grid = new Uint8Array(width * height);
  const reference = new Uint8Array(width * height);
  if (referenceValue != null && referenceValue <= maxValue) {
    const dotY = dotHeight - 1
      - Math.round((referenceValue / maxValue) * (dotHeight - 1));
    const row = Math.floor(dotY / 4);
    const dotRow = dotY % 4;
    const bits =
      (DOT_LEFT[dotRow] ?? 0) | (DOT_RIGHT[dotRow] ?? 0);
    for (let column = 0; column < width; column++) {
      reference[row * width + column] = bits;
    }
  }
  const visibleSamples = Math.min(dotWidth, sampleCount);
  const firstDot = dotWidth - visibleSamples;
  const firstSample = sampleCount - visibleSamples;
  for (let offset = 0; offset < visibleSamples; offset++) {
    const dotX = firstDot + offset;
    const sampleIndex = firstSample + offset;
    const value = readViewTime(sampleIndex);
    const dotY = dotHeight - 1
      - Math.round((Math.min(value, maxValue) / maxValue) * (dotHeight - 1));
    const column = Math.floor(dotX / 2);
    const row = Math.floor(dotY / 4);
    const dotRow = dotY % 4;
    const bits =
      (dotX % 2 === 0 ? DOT_LEFT[dotRow] : DOT_RIGHT[dotRow]) ?? 0;
    grid[row * width + column] |= bits;
  }
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const index = row * width + column;
      const sampleBits = grid[index] ?? 0;
      const referenceBits = reference[index] ?? 0;
      const code = sampleBits | referenceBits;
      if (code !== 0) {
        surface.set(x + column, y + row, {
          char: String.fromCharCode(BRAILLE_BASE | code),
          fg: sampleBits === 0 ? referenceForeground : foreground,
          bg: background,
        });
      }
    }
  }
}
