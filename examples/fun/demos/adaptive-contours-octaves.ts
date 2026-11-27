// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Adaptive Contouring in Fragment Shaders" by Ricky Reusser (Observable):
// blendedContours and shadedContours, which layer several octaves of locally scaled
// contours and fade the finest in and the coarsest out, like a Shepard tone.
import type { FieldSample } from './adaptive-contours-field.js';
import { fract, linearstep, localOctave, spacingGradient, triangle } from './adaptive-contours-lines.js';

/** How the octaves are laid: the finest spacing in pixels, divisions per octave, how many octaves, and the scaling. */
export interface OctaveSettings {
  readonly minSpacing: number;
  readonly divisions: number;
  readonly octaves: number;
  readonly linear: boolean;
}

/** GLSL smoothstep, which the notebook also calls with its edges reversed to fade out. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = linearstep(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

/** contrastFunction: a ramp from 0 to 1 whose slope gathers at the ends, like unsharp masking. */
export function contrastFunction(x: number, power: number): number {
  const y = 2 * x - 1;
  return 0.5 + 0.5 * Math.abs(y) ** power * Math.sign(y);
}

/** The loop both shaders share: `layer` draws one octave from its plot variable and its pixels-per-unit scale. */
function blendOctaves(s: FieldSample, o: OctaveSettings, layer: (plotVar: number, widthScale: number) => number): number {
  const local = localOctave(s, o.minSpacing, o.divisions, o.linear);
  const spacing = o.divisions ** Math.ceil(local);
  let plotVar = (o.linear ? s.value : Math.log2(s.value)) / spacing;
  let widthScale = spacing / spacingGradient(s, o.linear);
  let sum = 0;
  for (let i = 0; i < o.octaves; i += 1) {
    const t = i + 1 - fract(local);
    const weight = smoothstep(0, 1, t) * smoothstep(o.octaves, o.octaves - 1, t);
    sum += weight * layer(plotVar, widthScale);
    widthScale *= o.divisions;
    plotVar /= o.divisions;
  }
  return sum / o.octaves;
}

/** blendedContours: line contours over every octave, each weighted by how well its spacing suits the pixels. */
export function blendedContours(s: FieldSample, o: OctaveSettings, width: number, antialias: number): number {
  const aa = o.linear ? antialias / 2 : antialias;
  return blendOctaves(s, o, (plotVar, widthScale) =>
    linearstep(0.5 * (width + aa), 0.5 * (width - aa), triangle(plotVar) * widthScale));
}

/** shadedContours: the contrast ramp per octave, with its corner cut over `antialias` pixels where it drops back to 0. */
export function shadedContours(s: FieldSample, o: OctaveSettings, antialias: number, rampPower: number): number {
  const aa = Math.max(1e-4, o.linear ? antialias / 2 : antialias);
  return blendOctaves(s, o, (plotVar, widthScale) => {
    const y = fract(plotVar);
    return Math.min(contrastFunction(y, rampPower), ((1 - y) * 0.5 * widthScale) / aa);
  });
}
