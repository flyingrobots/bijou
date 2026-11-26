// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { fogOf, type Pixel } from './raycaster-texture.js';

const NONE: Pixel = { char: ' ', r: 0, g: 0, b: 0 };

function barrel(texX: number, texY: number): Pixel {
  const width = texY < 3 || texY > 12 ? 4.2 : 5.5;
  if (Math.abs(texX - 7.5) > width) return NONE;
  if (texY <= 2) return { char: (texX + texY) % 2 === 0 ? '^' : '*', r: 255, g: 120, b: 0 };
  return texY === 4 || texY === 11 ? { char: '=', r: 70, g: 70, b: 70 } : { char: '▒', r: 120, g: 75, b: 35 };
}

function monster(texX: number, texY: number): Pixel {
  const dx = Math.abs(texX - 7.5);
  const inside = (texY >= 2 && texY <= 5 && dx <= 3.2) || (texY >= 6 && texY <= 12 && dx <= 5.2) || (texY >= 13 && dx >= 1.5 && dx <= 4.2);
  if (!inside) return NONE;
  return texY === 3.5 && (texX === 6 || texX === 9) ? { char: '@', r: 255, g: 0, b: 0 } : { char: '▓', r: 30, g: 175, b: 50 };
}

function cup(texX: number, texY: number): Pixel {
  const dx = Math.abs(texX - 7.5);
  const inside = (texY >= 3 && texY <= 6 && dx <= 3.8) || (texY >= 7 && texY <= 11 && dx <= 1.2) || (texY >= 12 && texY <= 13 && dx <= 3.2);
  if (!inside) return NONE;
  return texY === 4.5 && dx === 0 ? { char: '*', r: 255, g: 0, b: 0 } : { char: '█', r: 245, g: 195, b: 15 };
}

/** One texel of a sprite (0 barrel, 1 monster, 2 treasure), fogged by depth. A blank character is see-through. */
export function spritePixel(texId: number, texX: number, texY: number, depth: number): Pixel {
  const base = texId === 0 ? barrel(texX, texY) : texId === 1 ? monster(texX, texY) : texId === 2 ? cup(texX, texY) : NONE;
  const fog = fogOf(depth);
  return { char: base.char, r: Math.round(base.r * fog), g: Math.round(base.g * fog), b: Math.round(base.b * fog) };
}
