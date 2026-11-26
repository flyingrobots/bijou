// Licensed under the Apache License, Version 2.0, like the rest of this repository.

export interface Point {
  readonly sx: number;
  readonly sy: number;
}

/** The funnel surface: its height at distance `radius` from the axis. */
export function funnelHeight(radius: number): number {
  return -0.5 - 2.5 / (radius + 0.2);
}

/** Perspective projection into braille-dot space (2 by 4 dots a cell). Null when behind the near plane. */
export function project(x: number, y: number, z: number, width: number, height: number): Point | null {
  const subWidth = width * 2;
  const pitch = 0.15;
  const dx = x;
  const dy = y - 3;
  const dz = z - 0.5;
  const ry = dy * Math.cos(pitch) - dz * Math.sin(pitch);
  const rz = dy * Math.sin(pitch) + dz * Math.cos(pitch);
  if (rz < 0.2) return null;
  const scale = subWidth * 0.38;
  return { sx: subWidth * 0.5 + (dx / rz) * scale, sy: height * 4 * 0.35 - (ry / rz) * scale };
}

/** Bresenham between two dots, clipped to the grid. */
export function drawDotLine(grid: Uint8Array, gridWidth: number, from: Point, to: Point): void {
  let x = Math.round(from.sx);
  let y = Math.round(from.sy);
  const x2 = Math.round(to.sx);
  const y2 = Math.round(to.sy);
  const dx = Math.abs(x2 - x);
  const dy = Math.abs(y2 - y);
  const stepX = x < x2 ? 1 : -1;
  const stepY = y < y2 ? 1 : -1;
  const rows = Math.floor(grid.length / gridWidth);
  let err = dx - dy;
  for (;;) {
    if (x >= 0 && x < gridWidth && y >= 0 && y < rows) grid[y * gridWidth + x] = 1;
    if (x === x2 && y === y2) return;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += stepX; }
    if (e2 < dx) { err += dx; y += stepY; }
  }
}

/** Draw a polyline of 3D points, breaking it wherever a point falls behind the camera. */
export function drawPath(
  grid: Uint8Array, width: number, height: number, count: number, at: (i: number) => readonly [number, number, number],
): void {
  let previous: Point | null = null;
  for (let i = 0; i <= count; i += 1) {
    const [x, y, z] = at(i);
    const point = project(x, y, z, width, height);
    if (point !== null && previous !== null) drawDotLine(grid, width * 2, previous, point);
    previous = point;
  }
}

/** The rings sliding down the funnel and the rays across it, as a dot grid `width * 2` by `height * 4`. */
export function wireframe(width: number, height: number, elapsed: number): Uint8Array {
  const grid = new Uint8Array(width * 2 * height * 4);
  const rings = 9;
  const uMax = 2.8;
  for (let i = 0; i < rings; i += 1) {
    const u = (((i * (uMax / rings) - elapsed * 0.35) % uMax) + uMax) % uMax;
    const radius = 0.8 + Math.exp(u);
    drawPath(grid, width, height, 80, (s) => {
      const phi = (s / 80) * 2 * Math.PI;
      return [radius * Math.cos(phi), funnelHeight(radius), 12 + radius * Math.sin(phi)];
    });
  }
  const rays = 32;
  for (let j = 0; j < rays; j += 1) {
    const phi = (j / rays) * 2 * Math.PI;
    drawPath(grid, width, height, 40, (s) => {
      const r = 1 + 24 * (s / 40);
      return [r * Math.cos(phi), funnelHeight(r), 12 + r * Math.sin(phi)];
    });
  }
  return grid;
}
