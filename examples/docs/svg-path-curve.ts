import type { SvgPoint } from './svg-path.js';

export function quadraticPoint(
  from: SvgPoint,
  control: SvgPoint,
  to: SvgPoint,
  factor: number,
): SvgPoint {
  const inverse = 1 - factor;
  return {
    x:
      inverse * inverse * from.x +
      2 * inverse * factor * control.x +
      factor * factor * to.x,
    y:
      inverse * inverse * from.y +
      2 * inverse * factor * control.y +
      factor * factor * to.y,
  };
}

export function samePoint(left: SvgPoint, right: SvgPoint): boolean {
  return left.x === right.x && left.y === right.y;
}
