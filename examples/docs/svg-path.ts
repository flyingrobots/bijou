import { quadraticPoint, samePoint } from './svg-path-curve.js';
import {
  isCommandToken, PATH_CLOSE, PATH_LINE, PATH_MOVE, PATH_QUADRATIC,
  tokenizePath,
  type PathToken,
} from './svg-path-tokens.js';

export interface SvgPoint {
  readonly x: number;
  readonly y: number;
}

export interface SvgPolygon {
  readonly points: readonly SvgPoint[];
}

/** Test seam: called once at the top of every main-loop iteration with a 1-based step count. */
export type PathStepObserver = (step: number) => void;

type PathCommand = typeof PATH_MOVE | typeof PATH_LINE | typeof PATH_QUADRATIC | typeof PATH_CLOSE;
const QUADRATIC_SEGMENTS = 12;

/**
 * Total over every string: it returns polygons or throws `SVG path: ... at
 * offset N.` Unsupported syntax and malformed input are rejected, never
 * skipped or reinterpreted under the previous command.
 */
export function parsePathPolygons(
  path: string,
  onStep?: PathStepObserver,
): readonly SvgPolygon[] {
  const tokens = tokenizePath(path);
  const polygons: SvgPolygon[] = [];
  let index = 0;
  let step = 0;
  let command: PathCommand | undefined;
  let current: SvgPoint | undefined;
  let start: SvgPoint | undefined;
  let points: SvgPoint[] = [];

  while (index < tokens.length) {
    // Invariant: every iteration consumes at least one token (index strictly
    // grows) or throws, so the loop runs at most tokens.length times. The
    // check after the branches makes that true by construction.
    onStep?.(++step);
    const before = index;
    const token = tokens[index];
    if (token === undefined) break;
    if (isCommandToken(token)) {
      command = commandOf(token);
      index++;
      if (command === PATH_CLOSE) closeCurrentPolygon();
      else requireNumber(tokens, index, token.offset);
    } else if (command === undefined) {
      throw new Error(`SVG path: number without a command at offset ${String(token.offset)}.`);
    } else if (command === PATH_CLOSE) {
      throw new Error(`SVG path: number after Z has no command at offset ${String(token.offset)}.`);
    } else if (command === PATH_MOVE || command === PATH_LINE) {
      const point = readPoint(tokens, index);
      index += 2;
      if (command === PATH_MOVE) {
        closeCurrentPolygon();
        start = point;
        points = [point];
        command = PATH_LINE;
      } else {
        points.push(point);
      }
      current = point;
    } else {
      if (current === undefined) {
        throw new Error(`SVG path: Q needs a current point at offset ${String(token.offset)}.`);
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
    if (index <= before) {
      throw new Error(`SVG path: parser made no progress at offset ${String(token.offset)}.`);
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

function commandOf(token: PathToken): PathCommand {
  const code = token.text.charCodeAt(0);
  switch (code) {
    case PATH_MOVE:
    case PATH_LINE:
    case PATH_QUADRATIC:
    case PATH_CLOSE:
      return code;
    default:
      throw new Error(`SVG path: unsupported command ${token.text} at offset ${String(token.offset)}.`);
  }
}

function requireNumber(
  tokens: readonly PathToken[],
  index: number,
  commandOffset: number,
): void {
  const next = tokens[index];
  if (next === undefined || isCommandToken(next)) {
    throw new Error(`SVG path: command is missing its numbers at offset ${String(commandOffset)}.`);
  }
}

function readPoint(tokens: readonly PathToken[], index: number): SvgPoint {
  const xToken = tokens[index];
  const yToken = tokens[index + 1];
  const offset = (xToken ?? tokens.at(-1))?.offset ?? 0;
  if (xToken === undefined || yToken === undefined) {
    throw new Error(`SVG path: incomplete point at offset ${String(offset)}.`);
  }
  if (isCommandToken(xToken) || isCommandToken(yToken)) {
    throw new Error(`SVG path: incomplete point at offset ${String(offset)}.`);
  }
  const x = Number(xToken.text);
  const y = Number(yToken.text);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`SVG path: non-finite number at offset ${String(offset)}.`);
  }
  return { x, y };
}
