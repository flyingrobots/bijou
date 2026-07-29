export interface SvgPoint {
  readonly x: number;
  readonly y: number;
}

export interface SvgPolygon {
  readonly points: readonly SvgPoint[];
}

type PathCommand = 'M' | 'L' | 'Q' | 'Z';
const PATH_COMMAND_RE = /[MLQZ]|-?(?:\d+\.?\d*|\.\d+)/g;
const QUADRATIC_SEGMENTS = 12;

export function parsePathPolygons(path: string): readonly SvgPolygon[] {
  const tokens = Array.from(path.matchAll(PATH_COMMAND_RE), ([token]) => token);
  const polygons: SvgPolygon[] = [];
  let index = 0;
  let command: PathCommand | undefined;
  let current: SvgPoint | undefined;
  let start: SvgPoint | undefined;
  let points: SvgPoint[] = [];

  while (index < tokens.length) {
    const token = tokens[index];
    if (token == null) break;
    if (isPathCommand(token)) {
      command = token;
      index++;
      if (command === 'Z') closeCurrentPolygon();
      continue;
    }
    if (command === undefined) {
      throw new Error('SVG path needs a command.');
    }
    if (command === 'M' || command === 'L') {
      const point = readPoint(tokens, index);
      index += 2;
      if (command === 'M') {
        closeCurrentPolygon();
        start = point;
        points = [point];
        command = 'L';
      } else {
        points.push(point);
      }
      current = point;
      continue;
    }
    if (command === 'Q') {
      if (current === undefined) {
        throw new Error('SVG quadratic point missing.');
      }
      const control = readPoint(tokens, index);
      const end = readPoint(tokens, index + 2);
      index += 4;
      for (let segment = 1; segment <= QUADRATIC_SEGMENTS; segment++) {
        points.push(
          quadraticPoint(current, control, end, segment / QUADRATIC_SEGMENTS),
        );
      }
      current = end;
    }
  }
  closeCurrentPolygon();
  return polygons;

  function closeCurrentPolygon(): void {
    if (points.length >= 3) {
      const last = points.at(-1);
      const closingPoints =
        start === undefined || last == null || samePoint(last, start)
          ? points
          : [...points, start];
      polygons.push({ points: closingPoints });
    }
    points = [];
    start = undefined;
    current = undefined;
  }
}

function readPoint(tokens: readonly string[], index: number): SvgPoint {
  const x = Number(tokens[index]);
  const y = Number(tokens[index + 1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('SVG point.');
  }
  return { x, y };
}

function quadraticPoint(
  from: SvgPoint,
  control: SvgPoint,
  to: SvgPoint,
  factor: number,
): SvgPoint {
  const inverse = 1 - factor;
  return {
    x:
      inverse * inverse * from.x +
      2 * inverse * factor * control.x +
      factor * factor * to.x,
    y:
      inverse * inverse * from.y +
      2 * inverse * factor * control.y +
      factor * factor * to.y,
  };
}

function isPathCommand(token: string): token is PathCommand {
  return /^[MLQZ]$/.exec(token) != null;
}

function samePoint(left: SvgPoint, right: SvgPoint): boolean {
  return left.x === right.x && left.y === right.y;
}
