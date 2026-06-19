import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rasterizeSvgToRgba, svgViewBoxAspectRatio } from '../examples/docs/svg-raster.js';

function alphaAt(
  frame: { readonly width: number; readonly data: Uint8ClampedArray | readonly number[] },
  x: number,
  y: number,
): number {
  return frame.data[((y * frame.width) + x) * 4 + 3] ?? 0;
}

function filledPixelCount(frame: { readonly data: Uint8ClampedArray | readonly number[] }): number {
  let count = 0;
  for (let offset = 3; offset < frame.data.length; offset += 4) {
    if ((frame.data[offset] ?? 0) > 0) count++;
  }
  return count;
}

describe('svg rasterizer', () => {
  it('fills absolute paths and preserves even-odd holes', () => {
    const svg = [
      '<svg viewBox="0 0 10 10">',
      '<path d="M 0 0 L 10 0 L 10 10 L 0 10 Z M 3 3 L 7 3 L 7 7 L 3 7 Z"/>',
      '</svg>',
    ].join('');

    const frame = rasterizeSvgToRgba(svg, { width: 20, height: 20 });

    expect(alphaAt(frame, 2, 2)).toBe(255);
    expect(alphaAt(frame, 10, 10)).toBe(0);
  });

  it('rejects relative path commands instead of treating them as absolute', () => {
    const svg = '<svg viewBox="0 0 10 10"><path d="m 0 0 l 10 0 l 0 10 z"/></svg>';

    expect(() => rasterizeSvgToRgba(svg, { width: 20, height: 20 })).toThrow(/without a command|path/);
  });

  it('rasterizes the committed Bijou SVG wordmark with its viewBox aspect', () => {
    const svg = readFileSync(resolve(import.meta.dirname, '..', 'assets', 'Bijou.svg'), 'utf8');
    const frame = rasterizeSvgToRgba(svg, { width: 180, height: 40 });

    expect(svgViewBoxAspectRatio(svg)).toBeCloseTo(673.602 / 150.001, 5);
    expect(alphaAt(frame, 0, 0)).toBe(0);
    expect(alphaAt(frame, frame.width - 1, frame.height - 1)).toBe(0);
    expect(filledPixelCount(frame)).toBeGreaterThan(2800);
    expect(filledPixelCount(frame)).toBeLessThan(6200);
  });
});
