// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface, type Surface } from '@flyingrobots/bijou';

export interface TankSize {
  readonly width: number;
  readonly height: number;
}

/** The tank before the shell has sent a `resize`: the pane an 80 by 24 terminal gives a demo. */
export const DEFAULT_TANK: TankSize = { width: 80, height: 22 };

/** The tank is the pane, but never smaller than the solvers can work in. */
export function tankFor(width: number, height: number): TankSize {
  return { width: Math.max(8, Math.floor(width)), height: Math.max(6, Math.floor(height)) };
}

/** Centre the tank in a pane. They match once the shell has sized the demo; a pane under the tank's minimum crops it. */
export function framePane(tank: Surface, width: number, height: number): Surface {
  const pane = createSurface(width, height);
  const dx = Math.floor((width - tank.width) / 2);
  const dy = Math.floor((height - tank.height) / 2);
  const sx = Math.max(0, -dx);
  const sy = Math.max(0, -dy);
  const w = Math.min(tank.width - sx, width - Math.max(0, dx));
  const h = Math.min(tank.height - sy, height - Math.max(0, dy));
  if (w > 0 && h > 0) pane.blit(tank, Math.max(0, dx), Math.max(0, dy), sx, sy, w, h);
  return pane;
}

/** The keys the two fluid demos share, and what each does to the tank. */
export const SHAKES: Readonly<Record<string, { readonly x: number; readonly y: number }>> = {
  z: { x: -6, y: 1.5 },
  x: { x: 0, y: 10 },
  c: { x: 6, y: 1.5 },
};

/** A keypress pours for this many pulses, as the original's key repeat did. */
export const POUR_PULSES = 6;
