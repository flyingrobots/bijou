import { parsePathPolygons, type SvgPolygon } from './svg-path.js';

export interface SvgGeometry {
  readonly width: number;
  readonly height: number;
  readonly polygons: readonly SvgPolygon[];
}

export function parseSvgGeometry(svg: string): SvgGeometry {
  const viewBoxText = /\bviewBox\s*=\s*"([^"]+)"/i.exec(svg)?.[1];
  if (viewBoxText == null) throw new Error('SVG viewBox.');
  const values = viewBoxText
    .split(/[\s,]+/)
    .filter((part) => part.length > 0)
    .map(Number);
  const [, , width, height] = values;
  if (
    width == null ||
    height == null ||
    values.length !== 4 ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new Error('SVG numeric viewBox.');
  }
  if (width <= 0 || height <= 0) {
    throw new Error('SVG positive viewBox.');
  }

  const polygons = Array.from(svg.matchAll(/\bd\s*=\s*"([^"]+)"/gi))
    .flatMap(([, path]) => (path == null ? [] : parsePathPolygons(path)))
    .filter((polygon) => polygon.points.length >= 3);
  if (polygons.length === 0) throw new Error('SVG path.');
  return { width, height, polygons };
}

export function isFilledEvenOdd(
  x: number,
  y: number,
  polygons: readonly SvgPolygon[],
): boolean {
  let crossings = 0;
  for (const { points } of polygons) {
    for (const [index, left] of points.entries()) {
      const right = points[(index + 1) % points.length];
      if (right == null || left.y > y === right.y > y) continue;
      const crossingX =
        left.x + ((y - left.y) * (right.x - left.x)) / (right.y - left.y);
      if (crossingX > x) crossings++;
    }
  }
  return crossings % 2 === 1;
}
