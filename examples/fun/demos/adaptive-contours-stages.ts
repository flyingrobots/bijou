// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "Adaptive Contouring in Fragment Shaders" by Ricky Reusser (Observable):
// the notebook's plots in the order it builds them, each a stage of one demo.
import type { FieldSample } from './adaptive-contours-field.js';
import { linearstep, localOctave, locallyScaledContours, logContours, logStripes, octaveColour } from './adaptive-contours-lines.js';
import { blendedContours, shadedContours } from './adaptive-contours-octaves.js';
import type { Rgb } from './pixels.js';

/** A colour as 0–1 channels, before gamma. */
export type Shade = readonly [number, number, number];

/** What the keys tune: a contour density multiplier, and log or linear contour placement. */
export interface StageParams {
  readonly density: number;
  readonly linear: boolean;
}

export interface Stage {
  readonly name: string;
  /** One line on what the stage adds to the one before. */
  readonly adds: string;
  /** Whether the log or linear choice changes this stage. */
  readonly scaled: boolean;
  /** Whether the view zooms in and out, as the notebook's last figure does. */
  readonly zooms: boolean;
  shade(s: FieldSample, p: StageParams): Shade;
}

const grey = (v: number): Shade => [v, v, v];

/**
 * The locally scaled figure's minimum spacing. The notebook's 15 pixels assumes a browser canvas; a terminal picture
 * is a few dozen half-block pixels tall, so the default is scaled down to keep several contours in view.
 */
const LOCAL_MIN_SPACING = 6;

const LOG_STRIPES: Stage = {
  name: 'Log stripes',
  adds: 'log2 |f| through a triangle-wave colour map',
  scaled: false,
  zooms: false,
  shade: (s, p) => grey(logStripes(s.value, 1 / p.density)),
};

/** The notebook's six figures, with its octave-colour checkbox shown as a stage of its own. */
export const STAGES: readonly Stage[] = [
  LOG_STRIPES,
  {
    name: 'Thresholded bands',
    adds: 'a threshold draws bands, but their width follows the slope',
    scaled: false,
    zooms: false,
    shade: (s, p) => grey(linearstep(0.05, 0.15, logStripes(s.value, 1 / p.density))),
  },
  {
    name: 'Screen-space contours',
    adds: 'dividing by the pixel gradient gives lines of even width',
    scaled: false,
    zooms: false,
    shade: (s, p) => grey(1 - logContours(s, p.density, 1, 1)),
  },
  {
    name: 'Locally scaled contours',
    adds: 'the local gradient picks each region a spacing octave',
    scaled: true,
    zooms: false,
    shade: (s, p) => grey(1 - locallyScaledContours(s, LOCAL_MIN_SPACING / p.density, 2, 1.5, 1.5, p.linear)),
  },
  {
    name: 'Octaves made visible',
    adds: 'tints each region by the octave its spacing came from',
    scaled: true,
    zooms: false,
    shade: (s, p) => {
      const minSpacing = LOCAL_MIN_SPACING / p.density;
      const tint = octaveColour(Math.ceil(localOctave(s, minSpacing, 2, p.linear)));
      const line = 1 - locallyScaledContours(s, minSpacing, 2, 1.5, 1.5, p.linear);
      return [line * (0.7 + 0.3 * tint[0]), line * (0.7 + 0.3 * tint[1]), line * (0.7 + 0.3 * tint[2])];
    },
  },
  {
    name: 'Blended octaves',
    adds: 'fades octaves in and out like a Shepard tone: no seams',
    scaled: true,
    zooms: false,
    shade: (s, p) => grey(1 - 1.5 * blendedContours(s, { minSpacing: 2 / p.density, divisions: 6, octaves: 4, linear: p.linear }, 1.5, 1.5)),
  },
  {
    name: 'Shaded octaves',
    adds: 'contrast ramps shade the octaves; zoom shows endless detail',
    scaled: true,
    zooms: true,
    shade: (s, p) => grey(1 - shadedContours(s, { minSpacing: 1 / p.density, divisions: 5, octaves: 4, linear: p.linear }, 1, 2)),
  },
];

/** The stage at `index`, wrapping both ways. */
export function stageAt(index: number): Stage {
  const n = STAGES.length;
  return STAGES[((index % n) + n) % n] ?? LOG_STRIPES;
}

/** The notebook's quick gamma correction, pow(c, 0.454), as 0–255 channels. */
export function toRgb(shade: Shade): Rgb {
  const channel = (c: number): number => Math.round(255 * Math.max(0, Math.min(1, c)) ** 0.454);
  return [channel(shade[0]), channel(shade[1]), channel(shade[2])];
}
