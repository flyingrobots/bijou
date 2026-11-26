// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';

/** A colour as 0–255 channels. */
export type Rgb = readonly [number, number, number];

/**
 * Paint a picture as half blocks: each cell is two square pixels, the top in the foreground of `▀` and the bottom in
 * its background, so a pane of `w` by `h` cells is a picture of `w` by `2h` pixels. `colour(x, y)` is asked at pixel
 * coordinates; with `samples` above 1 it is asked on a `samples` by `samples` grid inside each pixel and averaged,
 * which smooths the edges of filled shapes.
 */
export function paintPixels(surface: Surface, colour: (x: number, y: number) => Rgb, samples = 1): void {
  const n = Math.max(1, Math.floor(samples));
  const pixel = (px: number, py: number): Rgb => {
    if (n === 1) return colour(px + 0.5, py + 0.5);
    let r = 0;
    let g = 0;
    let b = 0;
    for (let sy = 0; sy < n; sy += 1) {
      for (let sx = 0; sx < n; sx += 1) {
        const [cr, cg, cb] = colour(px + (sx + 0.5) / n, py + (sy + 0.5) / n);
        r += cr;
        g += cg;
        b += cb;
      }
    }
    const count = n * n;
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
  };
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const [tr, tg, tb] = pixel(x, y * 2);
      const [br, bg, bb] = pixel(x, y * 2 + 1);
      surface.setRGB(x, y, '▀', tr, tg, tb, br, bg, bb);
    }
  }
}

/** A `#rrggbb` string as channels. */
export function hex(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The colour `t` of the way from `a` to `b`. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function luminance([r, g, b]: Rgb): number {
  const linear = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio of two colours, from 1 to 21. */
export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}
