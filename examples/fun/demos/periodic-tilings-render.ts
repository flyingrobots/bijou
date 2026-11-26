// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Synthesizing periodic tilings of the plane" by Claudio Esperança (Observable): paint the patch translated
// over the whole plane, faces filled from a d3 categorical scheme and outlined in the edge colour.
import type { Patch, Vec } from './periodic-tilings-geometry.js';
import { hex, type Rgb } from './pixels.js';

/** d3's categorical schemes, the notebook's non-interpolated palettes; it opens on Pastel2. */
export const SCHEMES: readonly { readonly name: string; readonly colors: readonly string[] }[] = [
  { name: 'Pastel2', colors: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'] },
  { name: 'Pastel1', colors: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'] },
  { name: 'Set2', colors: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'] },
  { name: 'Set3', colors: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'] },
  { name: 'Tableau10', colors: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'] },
  { name: 'Category10', colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'] },
  { name: 'Dark2', colors: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'] },
  { name: 'Accent', colors: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'] },
  { name: 'Paired', colors: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'] },
];

/** The notebook's edge colour and thickness: 2 pixels at an edge length of 30. */
const EDGE = hex('#222222');
const THICKNESS = 2 / 30;

/** How the patch sits on the picture: edge length in pixels, rotation in degrees, translation as a fraction of t1 + t2. */
export interface View {
  readonly edge: number;
  readonly angle: number;
  readonly shift: number;
  readonly scheme: number;
  readonly colorShift: number;
}

interface Face {
  readonly points: readonly Vec[];
  readonly colour: Rgb;
  /** The face's extent in lattice coordinates: point = a * t1 + b * t2. */
  readonly aMin: number;
  readonly aMax: number;
  readonly bMin: number;
  readonly bMax: number;
}

/** The colour of picture pixel (x, y) in a w by h picture. */
export function tilingPixel(patch: Patch, view: View, w: number, h: number): (x: number, y: number) => Rgb {
  const { t1, t2 } = patch;
  const det = t1.x * t2.y - t1.y * t2.x;
  const lattice = (p: Vec): readonly [number, number] => [(p.x * t2.y - p.y * t2.x) / det, (t1.x * p.y - t1.y * p.x) / det];
  const colors = SCHEMES[view.scheme % SCHEMES.length]?.colors ?? ['#cccccc'];
  const faces: Face[] = patch.faces.map((points, i) => {
    const coords = points.map(lattice);
    const as = coords.map((c) => c[0]);
    const bs = coords.map((c) => c[1]);
    return {
      points, colour: hex(colors[(i + view.colorShift) % colors.length] ?? '#cccccc'),
      aMin: Math.min(...as), aMax: Math.max(...as), bMin: Math.min(...bs), bMax: Math.max(...bs),
    };
  });
  const half = Math.max(THICKNESS / 2, 0.45 / view.edge);
  const rad = (-view.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const slide = { x: (t1.x + t2.x) * view.shift, y: (t1.y + t2.y) * view.shift };
  return (x, y) => {
    if (Math.abs(det) < 1e-9) return EDGE;
    const dx = x - w / 2;
    const dy = y - h / 2;
    const world = { x: (dx * cos - dy * sin) / view.edge - slide.x, y: (dx * sin + dy * cos) / view.edge - slide.y };
    const [a, b] = lattice(world);
    const fa = a - Math.floor(a);
    const fb = b - Math.floor(b);
    const p0 = { x: fa * t1.x + fb * t2.x, y: fa * t1.y + fb * t2.y };
    for (const face of faces) {
      for (let i = Math.ceil(fa - face.aMax); i <= Math.floor(fa - face.aMin); i += 1) {
        for (let j = Math.ceil(fb - face.bMax); j <= Math.floor(fb - face.bMin); j += 1) {
          const inset = insetOf(face.points, p0.x - i * t1.x - j * t2.x, p0.y - i * t1.y - j * t2.y);
          if (inset >= 0) return inset < half ? EDGE : face.colour;
        }
      }
    }
    return EDGE;
  };
}

/** How far inside a convex polygon (vertices counter-clockwise) a point lies; negative outside. */
function insetOf(points: readonly Vec[], px: number, py: number): number {
  let inset = Number.POSITIVE_INFINITY;
  for (let k = 0; k < points.length; k += 1) {
    const a = points[k] ?? { x: 0, y: 0 };
    const b = points[(k + 1) % points.length] ?? a;
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const length = Math.hypot(ex, ey);
    if (length === 0) continue;
    const d = (ex * (py - a.y) - ey * (px - a.x)) / length;
    if (d < inset) inset = d;
    if (inset < 0) return inset;
  }
  return points.length < 3 ? -1 : inset;
}
