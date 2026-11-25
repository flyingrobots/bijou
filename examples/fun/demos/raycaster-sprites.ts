// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { Surface } from '@flyingrobots/bijou';
import { spritePixel } from './raycaster-art.js';
import type { Sprite } from './raycaster-game.js';
import type { Camera } from './raycaster-walls.js';

const ASPECT = 0.52;

function paintSprite(surface: Surface, cam: Camera, zBuffer: Float32Array, s: Sprite): void {
  const { width, height } = surface;
  const spriteX = s.x - cam.x;
  const spriteY = s.y - cam.y;
  const invDet = 1.0 / (cam.planeX * cam.dirY - cam.dirX * cam.planeY);
  const transformX = invDet * (cam.dirY * spriteX - cam.dirX * spriteY);
  const transformY = invDet * (-cam.planeY * spriteX + cam.planeX * spriteY);
  if (transformY <= 0.1) return;
  const screenX = Math.floor((width / 2) * (1 + transformX / transformY));
  const spriteHeight = Math.abs(Math.floor(height / transformY));
  const spriteWidth = spriteHeight * ASPECT;
  const startY = Math.max(0, Math.floor(-spriteHeight / 2 + height / 2));
  const endY = Math.min(height - 1, Math.floor(spriteHeight / 2 + height / 2));
  const startX = Math.max(0, Math.floor(-spriteWidth / 2 + screenX));
  const endX = Math.min(width - 1, Math.floor(spriteWidth / 2 + screenX));
  for (let stripe = startX; stripe < endX; stripe++) {
    const wallDist = zBuffer[stripe];
    if (wallDist === undefined || transformY >= wallDist) continue;
    const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + screenX)) * 16 / spriteWidth) / 256;
    const column = Math.max(0, Math.min(15, Math.floor(texX)));
    for (let y = startY; y < endY; y++) {
      const d = y * 256 - height * 128 + spriteHeight * 128;
      const texY = Math.max(0, Math.min(15, Math.floor(((d * 16) / spriteHeight) / 256)));
      const pixel = spritePixel(s.texture, column, texY, transformY);
      if (pixel.char !== ' ') surface.setRGB(stripe, y, pixel.char, pixel.r, pixel.g, pixel.b, 0, 0, 0);
    }
  }
}

/** Draw the live sprites far to near, each stripe only where it is nearer than the wall. */
export function paintSprites(surface: Surface, cam: Camera, zBuffer: Float32Array, sprites: readonly Sprite[]): void {
  const far = (s: Sprite): number => (cam.x - s.x) ** 2 + (cam.y - s.y) ** 2;
  [...sprites].filter((s) => s.alive).sort((a, b) => far(b) - far(a)).forEach((s) => paintSprite(surface, cam, zBuffer, s));
}
