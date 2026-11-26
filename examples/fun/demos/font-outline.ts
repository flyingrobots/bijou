// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { PathCommand } from 'opentype.js';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Closed outlines of a glyph or a line of text, flattened to straight segments. */
export type Polygons = readonly (readonly Point[])[];

export interface Bounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

const STEPS = 8;

function bezier(from: Point, points: readonly Point[], t: number): Point {
  const mt = 1 - t;
  const [c1 = from, c2 = c1, end = c2] = points;
  return points.length === 2
    ? { x: mt * mt * from.x + 2 * mt * t * c1.x + t * t * c2.x, y: mt * mt * from.y + 2 * mt * t * c1.y + t * t * c2.y }
    : {
      x: mt * mt * mt * from.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * end.x,
      y: mt * mt * mt * from.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * end.y,
    };
}

/** Flatten path commands into closed polygons: curves become eight segments each, and `Z` closes the outline. */
export function flatten(commands: readonly PathCommand[]): Polygons {
  const paths: Point[][] = [];
  let current: Point[] = [];
  let at: Point = { x: 0, y: 0 };
  const curve = (points: readonly Point[]): void => {
    const from = at;
    for (let i = 1; i <= STEPS; i += 1) current.push(bezier(from, points, i / STEPS));
    at = points[points.length - 1] ?? from;
  };
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      if (current.length > 0) paths.push(current);
      at = { x: cmd.x, y: cmd.y };
      current = [at];
    } else if (cmd.type === 'L') {
      at = { x: cmd.x, y: cmd.y };
      current.push(at);
    } else if (cmd.type === 'Q') {
      curve([{ x: cmd.x1, y: cmd.y1 }, { x: cmd.x, y: cmd.y }]);
    } else if (cmd.type === 'C') {
      curve([{ x: cmd.x1, y: cmd.y1 }, { x: cmd.x2, y: cmd.y2 }, { x: cmd.x, y: cmd.y }]);
    } else if (current.length > 0) {
      const start = current[0];
      if (start !== undefined && (Math.abs(at.x - start.x) > 0.001 || Math.abs(at.y - start.y) > 0.001)) current.push({ ...start });
      paths.push(current);
      current = [];
    }
  }
  if (current.length > 0) paths.push(current);
  return paths;
}

/** The box around every point, or null when there are none. */
export function boundsOf(paths: Polygons): Bounds | null {
  let box: Bounds | null = null;
  for (const path of paths) {
    for (const { x, y } of path) {
      box = box === null ? { minX: x, maxX: x, minY: y, maxY: y }
        : { minX: Math.min(box.minX, x), maxX: Math.max(box.maxX, x), minY: Math.min(box.minY, y), maxY: Math.max(box.maxY, y) };
    }
  }
  return box;
}

/** The cells a shape can touch, clamped to a grid. It is empty (min above max) when the shape lies outside the grid. */
export function gridBounds(paths: Polygons, gridWidth: number, gridHeight: number): Bounds {
  const box = boundsOf(paths) ?? { minX: gridWidth, maxX: 0, minY: gridHeight, maxY: 0 };
  return {
    minX: Math.max(0, Math.floor(box.minX) - 1),
    maxX: Math.min(gridWidth - 1, Math.ceil(box.maxX) + 1),
    minY: Math.max(0, Math.floor(box.minY) - 1),
    maxY: Math.min(gridHeight - 1, Math.ceil(box.maxY) + 1),
  };
}

/**
 * Even-odd fill: calls `plot` for every cell inside `bounds` whose centre lies inside the outlines. It crosses each
 * row once, so a long message costs rows times segments, not cells times segments.
 */
export function fill(paths: Polygons, bounds: Bounds, plot: (x: number, y: number) => void): void {
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    const py = y + 0.5;
    const crossings: number[] = [];
    for (const path of paths) {
      for (let i = 0; i < path.length; i += 1) {
        const a = path[i];
        const b = path[(i + 1) % path.length];
        if (a === undefined || b === undefined) continue;
        if ((a.y <= py && b.y > py) || (b.y <= py && a.y > py)) crossings.push(a.x + ((py - a.y) * (b.x - a.x)) / (b.y - a.y));
      }
    }
    crossings.sort((left, right) => left - right);
    let passed = 0;
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      while (passed < crossings.length && (crossings[passed] ?? Infinity) <= x + 0.5) passed += 1;
      if ((crossings.length - passed) % 2 === 1) plot(x, y);
    }
  }
}
