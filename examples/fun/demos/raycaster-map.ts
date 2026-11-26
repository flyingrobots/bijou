// Licensed under the Apache License, Version 2.0, like the rest of this repository.

/** The level: 0 is empty, 1 red brick, 2 metal plate, 3 mossy stone, 4 tech wall. */
export const RAYCASTER_MAP: readonly (readonly number[])[] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,2,2,0,0,3,3,3,3,3,0,0,4,4,4,4,4,0,0,1],
  [1,0,2,0,0,0,2,0,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1],
  [1,0,2,0,0,0,2,0,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1],
  [1,0,2,0,0,0,2,0,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1],
  [1,0,2,2,0,2,2,0,0,3,3,0,3,3,0,0,4,4,0,4,4,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,2,2,0,2,2,0,0,1],
  [1,0,1,0,0,0,1,0,0,2,2,0,2,2,0,0,2,0,0,0,2,0,0,1],
  [1,0,1,0,0,0,1,0,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,1],
  [1,0,1,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,2,0,0,1],
  [1,0,1,0,0,0,1,0,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,1],
  [1,0,1,1,1,1,1,0,0,2,2,2,2,2,0,0,2,2,2,2,2,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,3,3,3,3,3,0,0,4,4,4,4,4,0,0,1,1,1,1,1,0,0,1],
  [1,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1,0,0,0,1,0,0,1],
  [1,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1,0,0,0,1,0,0,1],
  [1,0,3,0,0,0,3,0,0,4,0,0,0,4,0,0,1,0,0,0,1,0,0,1],
  [1,0,3,3,0,3,3,0,0,4,4,0,4,4,0,0,1,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const MAP_HEIGHT = RAYCASTER_MAP.length;
export const MAP_WIDTH = RAYCASTER_MAP[0]?.length ?? 0;

/** Whether a body of radius 0.22 fits at this point: all four corners of its square must be empty cells inside the map. */
export function canMoveTo(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  const radius = 0.22;
  const corners = [[x - radius, y - radius], [x + radius, y - radius], [x - radius, y + radius], [x + radius, y + radius]];
  for (const [cx = 0, cy = 0] of corners) {
    const mx = Math.floor(cx);
    const my = Math.floor(cy);
    if (mx < 0 || mx >= MAP_WIDTH || my < 0 || my >= MAP_HEIGHT) return false;
    if (RAYCASTER_MAP[my]?.[mx] !== 0) return false;
  }
  return true;
}
