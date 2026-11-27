// sha256 of the JSON of a frame's cells, per demo and pane size. Recorded from the
// seeded, pulse-driven sessions in tests/examples-fun-demos.test.ts: 30 pulses of 1/30 s,
// the demo's own key or pointer message, 30 more pulses, with seed 1888.
import { GOLDENS_A } from './examples-fun-goldens-a.js';
import { GOLDENS_B } from './examples-fun-goldens-b.js';

/** Every demo's recorded digests, kept in two files to stay inside the file-size gate. */
export const GOLDENS: Readonly<Record<string, string>> = { ...GOLDENS_A, ...GOLDENS_B };
