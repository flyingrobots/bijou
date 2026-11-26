// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "016 Some Triangles" by Saneef Ansari (Observable), after Manfred Mohr's
// "Programme 45 - Third Dimension in Flatland" (1969): triangles on one base whose
// peaks crowd toward the base's ends on a circle, angle over angle by a fixed ratio.
import { plotLine, type DotGrid } from './line-braille.js';

/** The original canvas is 975 units square and its radius is 60 short of half of it. */
const CANVAS = 975;
const RADIUS = CANVAS / 2 - 60;

/** Peaks on the unit circle, four per step: the angle π/2 divided by `ratio` once more each step, mirrored. */
export function peaks(ratio: number, divisions: number): (readonly [number, number])[] {
  const out: (readonly [number, number])[] = [];
  for (let i = 0; i < divisions / 2; i += 1) {
    const theta = Math.PI / 2 / ratio ** i;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    out.push([x, y], [x, -y], [-x, y], [-x, -y]);
  }
  return out;
}

/** Draw each triangle's two sides from the base's ends to its peak, centred in the dot grid. */
export function drawTriangles(out: DotGrid, ratio: number, divisions: number): void {
  const radius = (Math.min(out.width, out.height) * RADIUS) / CANVAS;
  const midX = out.width / 2;
  const midY = out.height / 2;
  for (const [x, y] of peaks(ratio, divisions)) {
    const px = midX + x * radius;
    const py = midY + y * radius;
    plotLine(out, midX - radius, midY, px, py);
    plotLine(out, px, py, midX + radius, midY);
  }
}
