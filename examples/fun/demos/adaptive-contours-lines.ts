// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Adaptive Contouring in Fragment Shaders" by Ricky Reusser (Observable):
// the notebook's GLSL contour functions, one pixel at a time. Each returns 0 in the
// background and 1 on a contour, with a feathered edge for antialiasing.
import type { FieldSample } from './adaptive-contours-field.js';

export const fract = (x: number): number => x - Math.floor(x);

/** GLSL clamp((x - edge0) / (edge1 - edge0), 0, 1): the notebook's linearstep, and its hardstep. */
export function linearstep(edge0: number, edge1: number, x: number): number {
  return Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
}

/** Distance to the nearest whole number, 0 to 0.5: half of the notebook's triangle wave. */
export const triangle = (x: number): number => 0.5 - Math.abs(fract(x) - 0.5);

/** logStripesColormap: log2 |f| through a triangle wave, 0 to 1. */
export function logStripes(f: number, spacing: number): number {
  return 2 * triangle(Math.log2(f) / spacing);
}

/** logContours: dividing the triangle wave by its screen-space gradient measures distance to a contour in pixels. */
export function logContours(s: FieldSample, spacing: number, width: number, antialias: number): number {
  const plotVar = Math.log2(s.value) * spacing;
  const screenSpaceGradient = (s.grad / s.value) * spacing;
  return linearstep(width + 0.5 * antialias, width - 0.5 * antialias, triangle(plotVar) / screenSpaceGradient);
}

/** The gradient the spacing follows: relative (the logarithmic derivative) for log contours, plain for linear ones. */
export function spacingGradient(s: FieldSample, linear: boolean): number {
  return linear ? s.grad : s.grad / s.value;
}

/** The fractional octave of a region: log base `divisions` of the gradient times the minimum spacing in pixels. */
export function localOctave(s: FieldSample, minSpacing: number, divisions: number, linear: boolean): number {
  return Math.log2(spacingGradient(s, linear) * minSpacing) / Math.log2(divisions);
}

/** locallyScaledLogContours: each region takes the spacing divisions^octave, so contours stay about minSpacing apart. */
export function locallyScaledContours(
  s: FieldSample,
  minSpacing: number,
  divisions: number,
  lineWidth: number,
  antialias: number,
  linear: boolean,
): number {
  const gradient = spacingGradient(s, linear);
  const spacing = divisions ** Math.ceil(localOctave(s, minSpacing, divisions, linear));
  const plotVar = (linear ? s.value : Math.log2(s.value)) / spacing;
  const widthScale = ((2 * spacing) / gradient) * (linear ? 2 : 1);
  return linearstep(lineWidth + antialias, lineWidth - antialias, triangle(plotVar) * widthScale);
}

/** randomColor(octave) from the notebook's debug view: a cosine palette indexed by the octave number. */
export function octaveColour(octave: number): readonly [number, number, number] {
  const third = (Math.PI * 2) / 3;
  return [0.5 + 0.5 * Math.cos(octave), 0.5 + 0.5 * Math.cos(octave - third), 0.5 + 0.5 * Math.cos(octave - 2 * third)];
}
