// Licensed under the Apache License, Version 2.0, like the rest of this repository.

export interface Pixel {
  readonly char: string;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Fog: full colour up to 2 units, fading to 12 per cent at 13. */
export function fogOf(depth: number): number {
  return depth <= 2.0 ? 1.0 : Math.max(0.12, 1.0 - (depth - 2.0) / (13.0 - 2.0));
}

function bricks(texX: number, texY: number): Pixel {
  const mortar = texY % 4 === 0 || (texX + Math.floor(texY / 4) * 8) % 16 === 0;
  return mortar ? { char: '░', r: 95, g: 95, b: 95 } : { char: '█', r: 175, g: 50, b: 50 };
}

function steel(texX: number, texY: number): Pixel {
  const rivet = (texX === 2 || texX === 13) && (texY === 2 || texY === 13);
  const edge = texX === 0 || texX === 15 || texY === 0 || texY === 15;
  if (rivet) return { char: 'o', r: 210, g: 210, b: 230 };
  return edge ? { char: '█', r: 75, g: 75, b: 85 } : { char: '▒', r: 130, g: 130, b: 140 };
}

function moss(texX: number, texY: number): Pixel {
  const mossy = Math.sin(texX * 0.45) + Math.cos(texY * 0.45) > 0.25;
  return mossy ? { char: '▓', r: 40, g: 145, b: 60 } : { char: '▒', r: 110, g: 105, b: 90 };
}

function tech(texX: number, texY: number, depth: number): Pixel {
  if (texX >= 3 && texX <= 12 && texY >= 3 && texY <= 9) {
    const active = (texX + texY + Math.floor(depth * 5)) % 4 === 0;
    return { char: active ? '1' : '0', r: 0, g: 210, b: 210 };
  }
  return texX % 4 === 0 || texY % 4 === 0 ? { char: '█', r: 40, g: 40, b: 60 } : { char: ' ', r: 15, g: 15, b: 25 };
}

/** One texel of a wall, as a character and colour: shaded on y-facing sides and fogged by depth. */
export function wallPixel(wallType: number, texX: number, texY: number, side: number, depth: number): Pixel {
  const base: Pixel = wallType === 1 ? bricks(texX, texY) : wallType === 2 ? steel(texX, texY)
    : wallType === 3 ? moss(texX, texY) : wallType === 4 ? tech(texX, texY, depth) : { char: ' ', r: 100, g: 100, b: 100 };
  const shade = side === 1 ? 0.72 : 1.0;
  const fog = fogOf(depth);
  return {
    char: base.char,
    r: Math.round(Math.round(base.r * shade) * fog),
    g: Math.round(Math.round(base.g * shade) * fog),
    b: Math.round(Math.round(base.b * shade) * fog),
  };
}
