import type { BijouContext, Cell, TokenValue } from '@flyingrobots/bijou';
export interface TransitionCell {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly progress: number;
  /** Stable pseudo-random [0, 1] based on coordinates — constant across frames. */
  readonly rand: number;
  /** Monotonic frame counter for temporal effects (glitch, static, etc.). */
  readonly frame: number;
  readonly ctx: BijouContext;
}
export type TransitionOverrideRole = 'decoration' | 'marker';
export interface TransitionResult {
  readonly showNext: boolean;
  readonly overrideChar?: string;
  /** Surface-native override cell. Merged on top of the selected base cell. */
  readonly overrideCell?: Cell;
  /** Semantic role of the override. Defaults to `'decoration'` if omitted. */
  readonly overrideRole?: TransitionOverrideRole;
}
export type TransitionShaderFn = (cell: TransitionCell) => TransitionResult;
export type WipeDirection = 'left' | 'right' | 'up' | 'down';
export type BuiltinTransition =
  | 'none'
  | 'wipe'
  | 'dissolve'
  | 'grid'
  | 'fade'
  | 'melt'
  | 'matrix'
  | 'scramble'
  | 'radial'
  | 'diamond'
  | 'spiral'
  | 'blinds'
  | 'curtain'
  | 'pixelate'
  | 'typewriter'
  | 'glitch'
  | 'static';
export function tokenCell(char: string, token: TokenValue): Cell {
  const cell: Cell = {
    char,
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers ? [...token.modifiers] : [],
    empty: false,
  };
  if (token.fgRGB) cell.fgRGB = token.fgRGB;
  if (token.bgRGB) cell.bgRGB = token.bgRGB;
  return cell;
}
export function noise(x: number, y: number, seed: number): number {
  // Constant offset (7.31) breaks the degenerate fixed point at (0, 0, 0).
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.7585 + 7.31) * 43758.5453;
  return v - Math.floor(v);
}
export interface OriginMetrics {
  readonly nx: number;
  readonly ny: number;
  readonly aspect: number;
  readonly dx: number;
  readonly dy: number;
  readonly dist: number;
  readonly maxDist: number;
  readonly normDist: number;
}
export function computeOriginMetrics(
  x: number, y: number, width: number, height: number,
  originX: number, originY: number,
): OriginMetrics {
  const nx = x / width;
  const ny = y / height;
  const aspect = width / Math.max(1, height) * 0.5; // chars are ~2:1 tall
  const dx = (nx - originX) * aspect;
  const dy = ny - originY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(
    Math.max(originX, 1 - originX) ** 2 * aspect * aspect
    + Math.max(originY, 1 - originY) ** 2,
  );
  const normDist = maxDist > 0 ? dist / maxDist : 0;
  return { nx, ny, aspect, dx, dy, dist, maxDist, normDist };
}
export const wipeShader: TransitionShaderFn = ({ x, width, progress }) => ({
  showNext: x / width < progress,
});
export const dissolveShader: TransitionShaderFn = ({ rand, progress }) => ({
  showNext: rand < progress,
});
