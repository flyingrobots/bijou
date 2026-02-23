import type { RGB, GradientStop } from './tokens.js';
/**
 * N-stop linear interpolation across a gradient.
 *
 * @param stops  Sorted array of gradient stops (by position, ascending).
 * @param t      Interpolation parameter (0..1). Values outside are clamped.
 * @returns      Interpolated RGB triple.
 */
export declare function lerp3(stops: GradientStop[], t: number): RGB;
/**
 * Apply a gradient across a string, coloring each character individually.
 * Falls back to plain text when NO_COLOR is set.
 */
export declare function gradientText(text: string, stops: GradientStop[]): string;
//# sourceMappingURL=gradient.d.ts.map