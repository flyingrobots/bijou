import { quadraticPoint, samePoint } from './svg-path-curve.js';
import {
  isCommandToken,
  pathError,
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

type PathCommand = 'M' | 'L' | 'Q' | 'Z';
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
      if (command === 'Z') closeCurrentPolygon();
      else requireNumber(tokens, index, token.offset);
    } else if (command === undefined) {
      throw pathError('number without a command', token.offset);
    } else if (command === 'Z') {
      throw pathError('number after Z has no command', token.offset);
    } else if (command === 'M' || command === 'L') {
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
    } else {
      if (current === undefined) {
        throw pathError('Q needs a current point', token.offset);
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
      throw pathError('parser made no progress', token.offset);
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
  switch (token.text) {
    case 'M':
    case 'L':
    case 'Q':
    case 'Z':
      return token.text;
    default:
      throw pathError(`unsupported command ${token.text}`, token.offset);
  }
}

function requireNumber(
  tokens: readonly PathToken[],
  index: number,
  commandOffset: number,
): void {
  const next = tokens[index];
  if (next === undefined || isCommandToken(next)) {
    throw pathError('command is missing its numbers', commandOffset);
  }
}

function readPoint(tokens: readonly PathToken[], index: number): SvgPoint {
  const xToken = tokens[index];
  const yToken = tokens[index + 1];
  const offset = (xToken ?? tokens.at(-1))?.offset ?? 0;
  if (xToken === undefined || yToken === undefined) {
    throw pathError('incomplete point', offset);
  }
  if (isCommandToken(xToken) || isCommandToken(yToken)) {
    throw pathError('incomplete point', offset);
  }
  const x = Number(xToken.text);
  const y = Number(yToken.text);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw pathError('non-finite number', offset);
  }
  return { x, y };
}
