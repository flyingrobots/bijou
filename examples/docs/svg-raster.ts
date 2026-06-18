import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Polygon {
  readonly points: readonly Point[];
}

interface SvgGeometry {
  readonly width: number;
  readonly height: number;
  readonly polygons: readonly Polygon[];
}

interface RasterizeSvgOptions {
  readonly width: number;
  readonly height: number;
  readonly padding?: number;
}

type PathCommand = 'M' | 'L' | 'Q' | 'Z';

const PATH_COMMAND_RE = /[MLQZ]|-?(?:\d+\.?\d*|\.\d+)/g;
const QUADRATIC_SEGMENTS = 12;

export function rasterizeSvgToRgba(svg: string, options: RasterizeSvgOptions): RgbaFrame {
  const width = sanitizeRasterDimension(options.width);
  const height = sanitizeRasterDimension(options.height);
  const padding = Math.max(0, options.padding ?? 0);
  const geometry = parseSvgGeometry(svg);
  const data = new Uint8ClampedArray(width * height * 4);

  if (width === 0 || height === 0) {
    return { width, height, data };
  }

  const drawableWidth = Math.max(1, width - (padding * 2));
  const drawableHeight = Math.max(1, height - (padding * 2));
  const scale = Math.min(drawableWidth / geometry.width, drawableHeight / geometry.height);
  const offsetX = (width - (geometry.width * scale)) / 2;
  const offsetY = (height - (geometry.height * scale)) / 2;
  const transformed = geometry.polygons.map((polygon) => ({
    points: polygon.points.map((point) => ({
      x: offsetX + (point.x * scale),
      y: offsetY + (point.y * scale),
    })),
  }));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFilledEvenOdd(x + 0.5, y + 0.5, transformed)) continue;

      const offset = ((y * width) + x) * 4;
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 255;
    }
  }

  return { width, height, data };
}

export function svgViewBoxAspectRatio(svg: string): number {
  const geometry = parseSvgGeometry(svg);
  return geometry.width / geometry.height;
}

function parseSvgGeometry(svg: string): SvgGeometry {
  const viewBox = /\bviewBox\s*=\s*"([^"]+)"/i.exec(svg);
  if (viewBox == null) {
    throw new Error('SVG rasterizer expected a viewBox.');
  }

  const viewBoxValues = viewBox[1]!
    .split(/[\s,]+/)
    .filter((part) => part.length > 0)
    .map(Number);
  if (viewBoxValues.length !== 4 || viewBoxValues.some((value) => !Number.isFinite(value))) {
    throw new Error('SVG rasterizer expected a numeric viewBox.');
  }

  const width = viewBoxValues[2]!;
  const height = viewBoxValues[3]!;
  if (width <= 0 || height <= 0) {
    throw new Error('SVG rasterizer expected a positive viewBox size.');
  }

  const polygons = Array.from(svg.matchAll(/\bd\s*=\s*"([^"]+)"/gi))
    .flatMap((match) => parsePathPolygons(match[1]!))
    .filter((polygon) => polygon.points.length >= 3);

  if (polygons.length === 0) {
    throw new Error('SVG rasterizer expected at least one path.');
  }

  return { width, height, polygons };
}

function parsePathPolygons(path: string): readonly Polygon[] {
  const tokens = Array.from(path.matchAll(PATH_COMMAND_RE), (match) => match[0]);
  const polygons: Polygon[] = [];
  let index = 0;
  let command: PathCommand | undefined;
  let current: Point | undefined;
  let start: Point | undefined;
  let points: Point[] = [];

  while (index < tokens.length) {
    const token = tokens[index]!;
    if (isPathCommand(token)) {
      command = token.toUpperCase() as PathCommand;
      index++;
      if (command === 'Z') {
        closeCurrentPolygon();
      }
      continue;
    }

    if (command === undefined) {
      throw new Error('SVG path data started without a command.');
    }

    switch (command) {
      case 'M': {
        const point = readPoint(tokens, index);
        index += 2;
        closeCurrentPolygon();
        current = point;
        start = point;
        points = [point];
        command = 'L';
        break;
      }
      case 'L': {
        const point = readPoint(tokens, index);
        index += 2;
        points.push(point);
        current = point;
        break;
      }
      case 'Q': {
        if (current === undefined) {
          throw new Error('SVG quadratic path segment had no current point.');
        }
        const control = readPoint(tokens, index);
        const end = readPoint(tokens, index + 2);
        index += 4;
        for (let segment = 1; segment <= QUADRATIC_SEGMENTS; segment++) {
          points.push(quadraticPoint(current, control, end, segment / QUADRATIC_SEGMENTS));
        }
        current = end;
        break;
      }
      case 'Z':
        closeCurrentPolygon();
        break;
    }
  }

  closeCurrentPolygon();
  return polygons;

  function closeCurrentPolygon(): void {
    if (points.length >= 3) {
      const closingPoints = start === undefined || samePoint(points[points.length - 1]!, start)
        ? points
        : [...points, start];
      polygons.push({ points: closingPoints });
    }
    points = [];
    start = undefined;
    current = undefined;
  }
}

function readPoint(tokens: readonly string[], index: number): Point {
  const x = Number(tokens[index]);
  const y = Number(tokens[index + 1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('SVG path data contained an invalid point.');
  }
  return { x, y };
}

function quadraticPoint(from: Point, control: Point, to: Point, t: number): Point {
  const inverse = 1 - t;
  return {
    x: (inverse * inverse * from.x) + (2 * inverse * t * control.x) + (t * t * to.x),
    y: (inverse * inverse * from.y) + (2 * inverse * t * control.y) + (t * t * to.y),
  };
}

function isFilledEvenOdd(x: number, y: number, polygons: readonly Polygon[]): boolean {
  let crossings = 0;
  for (const polygon of polygons) {
    const points = polygon.points;
    for (let index = 0; index < points.length; index++) {
      const a = points[index]!;
      const b = points[(index + 1) % points.length]!;
      if ((a.y > y) === (b.y > y)) continue;

      const crossingX = a.x + (((y - a.y) * (b.x - a.x)) / (b.y - a.y));
      if (crossingX > x) crossings++;
    }
  }
  return crossings % 2 === 1;
}

function isPathCommand(token: string): boolean {
  return /^[MLQZ]$/.test(token);
}

function samePoint(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}

function sanitizeRasterDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}
