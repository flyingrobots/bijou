// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';
import { MAP_HEIGHT, MAP_WIDTH, RAYCASTER_MAP } from './raycaster-map.js';
import { wallPixel } from './raycaster-texture.js';

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly dirX: number;
  readonly dirY: number;
  readonly planeX: number;
  readonly planeY: number;
}

export function cameraOf(x: number, y: number, angle: number): Camera {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  return { x, y, dirX, dirY, planeX: -dirY * 0.66, planeY: dirX * 0.66 };
}

interface Wall {
  readonly cell: number;
  readonly side: number;
  readonly dist: number;
  readonly texX: number;
}

/** Walk one ray across the grid (DDA) to the first wall; a ray that finds none ends at 16 units. */
function castRay(cam: Camera, rayDirX: number, rayDirY: number): Wall {
  let mapX = Math.floor(cam.x);
  let mapY = Math.floor(cam.y);
  const deltaDistX = rayDirX === 0 ? Infinity : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? Infinity : Math.abs(1 / rayDirY);
  const stepX = rayDirX < 0 ? -1 : 1;
  const stepY = rayDirY < 0 ? -1 : 1;
  let sideDistX = (rayDirX < 0 ? cam.x - mapX : mapX + 1.0 - cam.x) * deltaDistX;
  let sideDistY = (rayDirY < 0 ? cam.y - mapY : mapY + 1.0 - cam.y) * deltaDistY;
  let cell = 0;
  let side = 0;
  for (let steps = 0; cell === 0 && steps < 40; steps++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) break;
    const found = RAYCASTER_MAP[mapY]?.[mapX];
    if (found !== undefined && found > 0) cell = found;
  }
  let dist = 16.0;
  if (cell > 0) dist = side === 0 ? (mapX - cam.x + (1 - stepX) / 2) / rayDirX : (mapY - cam.y + (1 - stepY) / 2) / rayDirY;
  dist = Math.max(0.08, dist);
  let wallX = side === 0 ? cam.y + dist * rayDirY : cam.x + dist * rayDirX;
  wallX -= Math.floor(wallX);
  let texX = Math.floor(wallX * 16.0);
  if (side === 0 && rayDirX > 0) texX = 15 - texX;
  if (side === 1 && rayDirY < 0) texX = 15 - texX;
  return { cell, side, dist, texX: Math.max(0, Math.min(15, texX)) };
}

function paintColumn(surface: Surface, x: number, wall: Wall): void {
  const { height } = surface;
  const lineHeight = Math.floor(height / wall.dist);
  const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + height / 2));
  let drawEnd = Math.floor(lineHeight / 2 + height / 2);
  if (drawEnd >= height) drawEnd = height - 1;
  for (let y = 0; y < height; y++) {
    if (y < drawStart) {
      const ratio = y / (height * 0.5);
      surface.setRGB(x, y, ' ', 0, 0, 0, Math.round(15 * ratio + 5 * (1 - ratio)), Math.round(15 * ratio + 5 * (1 - ratio)), Math.round(30 * ratio + 10 * (1 - ratio)));
    } else if (y > drawEnd) {
      const ratio = (height - y) / (height * 0.5);
      surface.setRGB(x, y, '░', Math.round(40 * ratio + 15 * (1 - ratio)), Math.round(35 * ratio + 15 * (1 - ratio)), Math.round(35 * ratio + 15 * (1 - ratio)), 0, 0, 0);
    } else {
      const d = y * 256 - height * 128 + lineHeight * 128;
      const texY = Math.max(0, Math.min(15, Math.floor(((d * 16) / lineHeight) / 256)));
      const px = wallPixel(wall.cell, wall.texX, texY, wall.side, wall.dist);
      surface.setRGB(x, y, px.char, px.r, px.g, px.b, 0, 0, 0);
    }
  }
}

/** Paint the ceiling, walls and floor, and return each column's wall distance for the sprite pass. */
export function paintWalls(surface: Surface, cam: Camera): Float32Array {
  const zBuffer = new Float32Array(surface.width);
  for (let x = 0; x < surface.width; x++) {
    const cameraX = (2 * x) / surface.width - 1;
    const wall = castRay(cam, cam.dirX + cam.planeX * cameraX, cam.dirY + cam.planeY * cameraX);
    zBuffer[x] = wall.dist;
    paintColumn(surface, x, wall);
  }
  return zBuffer;
}
