// Licensed under the Apache License, Version 2.0, like the rest of this repository.

/** A particle of the tank fluid: a position and a velocity in cells and cells per step. */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

/** The five edges of the convex well, clockwise. */
function edgesOf(cx: number, cy: number): readonly (readonly [Point, Point])[] {
  const vertices: readonly Point[] = [
    { x: cx - 18, y: cy + 3 },
    { x: cx - 8, y: cy - 10 },
    { x: cx + 8, y: cy - 10 },
    { x: cx + 18, y: cy + 3 },
    { x: cx, y: cy + 12 },
  ];
  return vertices.map((a, i): readonly [Point, Point] => [a, vertices[(i + 1) % vertices.length] ?? a]);
}

/** Hold the particle in the tank: walls and ceiling swallow slow motion and keep a little bounce at speed. */
export function resolveBoundaryCollision(p: Particle, width: number, height: number): void {
  const bounce = 0.05;
  const friction = 0.92;
  if (p.x < 1.5 || p.x > width - 1.5) {
    p.x = p.x < 1.5 ? 1.5 : width - 1.5;
    p.vx = Math.abs(p.vx) < 0.25 ? 0 : -p.vx * bounce;
    p.vy *= friction;
  }
  if (p.y < 1.0 || p.y > height - 1.5) {
    p.y = p.y < 1.0 ? 1.0 : height - 1.5;
    p.vy = Math.abs(p.vy) < 0.25 ? 0 : -p.vy * bounce;
    p.vx *= friction;
  }
}

/** Push a particle that is inside the well out through the nearest edge and damp the motion into it. */
export function resolveObstacleCollision(p: Particle, cx: number, cy: number): void {
  let minOverlap = Infinity;
  let normal = { x: 0, y: 0 };
  let target = { x: p.x, y: p.y };
  for (const [a, b] of edgesOf(cx, cy)) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const cross = dx * (p.y - a.y) - dy * (p.x - a.x);
    if (cross > 0) return;
    const len = Math.sqrt(dx * dx + dy * dy);
    const dist = -cross / len;
    if (dist < minOverlap) {
      minOverlap = dist;
      normal = { x: -dy / len, y: dx / len };
      target = { x: p.x + normal.x * dist, y: p.y + normal.y * dist };
    }
  }
  p.x = target.x + normal.x * 0.1;
  p.y = target.y + normal.y * 0.1;
  const dot = p.vx * normal.x + p.vy * normal.y;
  const tangentX = p.vx - normal.x * dot;
  const tangentY = p.vy - normal.y * dot;
  const bounce = 0.04;
  const friction = 0.88;
  const slow = Math.abs(dot) < 0.25;
  p.vx = tangentX * friction - (slow ? 0 : normal.x * dot * bounce);
  p.vy = tangentY * friction - (slow ? 0 : normal.y * dot * bounce);
}

export function isPointInObstacle(x: number, y: number, cx: number, cy: number): boolean {
  return edgesOf(cx, cy).every(([a, b]) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) <= 0);
}
