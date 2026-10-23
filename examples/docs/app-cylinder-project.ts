import type { RasterFontGlyph } from '../../packages/bijou-tui/src/index.js';

export interface CylinderGrid {
  readonly width: number;
  readonly height: number;
  readonly depth: Float32Array;
  readonly light: Float32Array;
}

export interface GlyphProjection {
  readonly scale: number;
  readonly xOffset: number;
  readonly sin: number;
  readonly cos: number;
  readonly radius: number;
  readonly focal: number;
  readonly centerX: number;
  readonly centerY: number;
}

/** Inverse-project a planar glyph texture onto the front of the rolling cylinder. */
export function rasterizeCylinderGlyph(glyph: RasterFontGlyph, p: GlyphProjection, grid: CylinderGrid): void {
  const g = glyph.geometry;
  const corners = [
    project(g.left, g.top, p), project(g.left + g.width, g.top, p),
    project(g.left, g.top + g.height, p), project(g.left + g.width, g.top + g.height, p),
  ];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map((point) => point.x))));
  const maxX = Math.min(grid.width - 1, Math.ceil(Math.max(...corners.map((point) => point.x))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map((point) => point.y))));
  const maxY = Math.min(grid.height - 1, Math.ceil(Math.max(...corners.map((point) => point.y))));
  for (let y = minY; y <= maxY; y++) {
    const screenY = p.centerY - y - 0.5;
    const denominator = p.focal * p.cos + screenY * p.sin;
    if (Math.abs(denominator) < 0.000001) continue;
    const localY = (screenY * (p.focal + p.radius - p.radius * p.cos)
      + p.focal * p.radius * p.sin) / denominator;
    const distance = p.focal + p.radius - p.radius * p.cos - localY * p.sin;
    if (distance <= 0) continue;
    const perspective = p.focal / distance;
    for (let x = minX; x <= maxX; x++) {
      const index = y * grid.width + x;
      if (distance >= (grid.depth[index] ?? Infinity)) continue;
      const localX = (x + 0.5 - p.centerX) / perspective - p.xOffset;
      if (!glyph.sample(localX / p.scale, -localY / p.scale)) continue;
      grid.depth[index] = distance;
      grid.light[index] = 0.35 + 0.65 * p.cos;
    }
  }
}

function project(x: number, y: number, p: GlyphProjection): { readonly x: number; readonly y: number } {
  const localY = -y * p.scale;
  const z = localY * p.sin + p.radius * p.cos - p.radius;
  const perspective = p.focal / (p.focal - z);
  return {
    x: p.centerX + (p.xOffset + x * p.scale) * perspective,
    y: p.centerY - (localY * p.cos - p.radius * p.sin) * perspective,
  };
}
