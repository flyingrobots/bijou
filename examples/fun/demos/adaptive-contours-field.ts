// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Adaptive Contouring in Fragment Shaders" by Ricky Reusser (Observable):
// the sample function, the view that maps pixels into the complex plane, and the
// screen-space derivative a fragment shader gets from dFdx and dFdy, here taken as
// finite differences between neighbouring pixels.

/** A picture `w` by `h` pixels looking at the plane: `scale` is half the visible height; the root is the notebook's mouse. */
export interface PlaneView {
  readonly w: number;
  readonly h: number;
  readonly scale: number;
  readonly rootX: number;
  readonly rootY: number;
}

/** A function value and its screen-space gradient magnitude, in units per pixel. */
export interface FieldSample {
  readonly value: number;
  readonly grad: number;
}

/** The smallest magnitude the field reports, so logarithms and divisions stay finite at zeros and poles. */
const TINY = 1e-12;

/** The point of the plane under pixel (px, py), as the notebook's ortho view: y spans -scale to scale, x keeps the aspect. */
export function toPlane(view: PlaneView, px: number, py: number): readonly [number, number] {
  const aspect = view.w / Math.max(1, view.h);
  return [view.scale * aspect * ((2 * px) / Math.max(1, view.w) - 1), view.scale * (1 - (2 * py) / Math.max(1, view.h))];
}

/** |f(z)| for the notebook's f(z) = (z - 1) / (z + 1) · (z - root): a zero at 1, a pole at -1, a zero at the root. */
export function magnitude(x: number, y: number, rootX: number, rootY: number): number {
  const below = Math.max(TINY, Math.hypot(x + 1, y));
  return (Math.hypot(x - 1, y) / below) * Math.hypot(x - rootX, y - rootY);
}

/** |f| at pixel (px, py) and the length of its pixel-space gradient by central differences one pixel wide. */
export function sampleField(view: PlaneView, px: number, py: number): FieldSample {
  const at = (qx: number, qy: number): number => {
    const [x, y] = toPlane(view, qx, qy);
    return magnitude(x, y, view.rootX, view.rootY);
  };
  const dx = at(px + 0.5, py) - at(px - 0.5, py);
  const dy = at(px, py + 0.5) - at(px, py - 0.5);
  return { value: Math.max(TINY, at(px, py)), grad: Math.max(TINY, Math.hypot(dx, dy)) };
}
