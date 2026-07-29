/**
 * Scenario: soak — 1000-frame stability test.
 *
 * Exercises the differ over many frames with a realistic multi-region
 * workload. Each frame mutates ~15-20% of cells with rotating hotspots
 * across header / sidebar / body / footer regions. Every 100 frames a
 * simulated "resize" clears both surfaces and repaints from scratch.
 *
 * Designed to surface:
 * - Memory leaks (growing buffers, uncollected garbage)
 * - Performance degradation over time (cache pollution, buffer bloat)
 * - Frame-time stability (is frame 900 as fast as frame 10?)
 *
 * The high frame count (1000 measurement frames) means this scenario
 * runs slower than others (~20-30s). Use --scenario=soak explicitly.
 */

import { createSurface } from '@flyingrobots/bijou';
import type { Scenario } from './types.js';
import { isPacked, createSink, stubStyle } from './_shared.js';
import { paintSoakBase, SOAK_COLUMNS, SOAK_ROWS } from './soak-layout.js';
import { renderSoakFrame, type SoakState } from './soak-frame.js';

export const soak: Scenario<SoakState> = {
  id: 'soak',
  label: 'Soak: 1000-frame stability (220×58)',
  tags: ['diff', 'compose', 'soak', 'nightly', 'long-run'],
  description:
    'Multi-region composition with rotating partial updates (~15-20% dirty/frame) over 1000 measurement frames. Cycles header/sidebar/body/footer hotspots. Simulates a resize clear+repaint every 100 frames. Designed to surface memory leaks, cache pollution, and frame-time degradation.',
  columns: SOAK_COLUMNS,
  rows: SOAK_ROWS,
  defaultWarmupFrames: 50,
  defaultMeasureFrames: 1000,

  setup(_ctx, columns = SOAK_COLUMNS, rows = SOAK_ROWS) {
    const current = createSurface(columns, rows);
    const target = createSurface(columns, rows);
    if (!isPacked(current) || !isPacked(target)) {
      throw new Error('soak requires PackedSurfaces');
    }
    // Paint the initial base layout into both surfaces so the first
    // frame diff starts from a realistic "already rendered" state.
    paintSoakBase(target, columns, rows);
    paintSoakBase(current, columns, rows);
    target.markAllRenderClean();
    current.markAllRenderClean();
    return {
      current,
      target,
      sink: createSink(),
      style: stubStyle,
      cols: columns,
      rows,
    };
  },

  frame(state, frameIndex) {
    renderSoakFrame(state, frameIndex);
  },

  getDisplaySurface(state) {
    return state.target;
  },
};
