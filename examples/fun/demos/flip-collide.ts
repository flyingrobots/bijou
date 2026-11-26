// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The FLIP method here is after Matthias Mueller (Ten Minute Physics, 2022), MIT License.
import { at, type FlipFluid } from './flip-core.js';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The obstacle: a triangle whose circumcircle has the given centre and radius. */
export function trianglePoints(x: number, y: number, radius: number): readonly [Point, Point, Point] {
  const reach = radius * Math.cos(Math.PI / 6);
  const low = y - radius * Math.sin(Math.PI / 6);
  return [{ x, y: y + radius }, { x: x - reach, y: low }, { x: x + reach, y: low }];
}

function sign(px: number, py: number, a: Point, b: Point): number {
  return (px - b.x) * (a.y - b.y) - (a.x - b.x) * (py - b.y);
}

function pointInTriangle(px: number, py: number, [a, b, c]: readonly [Point, Point, Point]): boolean {
  const d1 = sign(px, py, a, b);
  const d2 = sign(px, py, b, c);
  const d3 = sign(px, py, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/** The point on the triangle's outline nearest to (x, y). */
function nearestOnOutline(x: number, y: number, [a, b, c]: readonly [Point, Point, Point]): Point {
  let closest: Point = { x, y };
  let minDist = Infinity;
  for (const [p1, p2] of [[a, b], [b, c], [c, a]] as const) {
    const edgeX = p2.x - p1.x;
    const edgeY = p2.y - p1.y;
    const len = edgeX * edgeX + edgeY * edgeY;
    const t = Math.max(0, Math.min(1, ((x - p1.x) * edgeX + (y - p1.y) * edgeY) / len));
    const projX = p1.x + t * edgeX;
    const projY = p1.y + t * edgeY;
    const dist = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
    if (dist < minDist) {
      minDist = dist;
      closest = { x: projX, y: projY };
    }
  }
  return closest;
}

/** Keep the particles out of the triangle and inside the tank, stopping the velocity they lose contact on. */
export function handleParticleCollisions(f: FlipFluid, obstacleX: number, obstacleY: number, obstacleRadius: number): void {
  const h = 1.0 / f.fInvSpacing;
  const r = f.particleRadius;
  const minX = h + r;
  const maxX = (f.fNumX - 1) * h - r;
  const minY = h + r;
  const maxY = (f.fNumY - 1) * h - r;
  const triangle = trianglePoints(obstacleX, obstacleY, obstacleRadius);
  for (let i = 0; i < f.numParticles; i += 1) {
    let x = at(f.particlePos, 2 * i);
    let y = at(f.particlePos, 2 * i + 1);
    if (obstacleRadius > 0 && pointInTriangle(x, y, triangle)) {
      ({ x, y } = nearestOnOutline(x, y, triangle));
      f.particleVel[2 * i] = 0.0;
      f.particleVel[2 * i + 1] = 0.0;
    }
    if (x < minX || x > maxX) {
      x = x < minX ? minX : maxX;
      f.particleVel[2 * i] = 0.0;
    }
    if (y < minY || y > maxY) {
      y = y < minY ? minY : maxY;
      f.particleVel[2 * i + 1] = 0.0;
    }
    f.particlePos[2 * i] = x;
    f.particlePos[2 * i + 1] = y;
  }
}
