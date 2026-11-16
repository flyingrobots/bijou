import type { BijouContext, Surface } from '../../packages/bijou/src/index.js';
import {
  diamond,
  isKeyMsg,
  isPulseMsg,
  isResizeMsg,
  matrixShader,
  meltShader,
  quit,
  wipe,
  type App,
} from '../../packages/bijou-tui/src/index.js';
import { createInitialModel, currentSeed, updateKey, type HeroModel } from './app-model.js';
import {
  DAG_FOCUS_ORDER,
  dashboardScene,
  filled,
  paletteOverlay,
  raytraceScene,
  titleScene,
  type PerfSample,
} from './scenes.js';
import { plotScene } from './plot-scene.js';
import { compilePalette } from './theme.js';
import { applyTransition } from './transition.js';

export type { HeroModel } from './app-model.js';

/** Scene timeline in seconds. Keys (palette, focus, resize) stay live in every phase. */
export const TIMELINE = {
  meltIn: [0, 1.6],
  titleToDash: [3.0, 4.0],
  dashToPlot: [7.6, 8.4],
  plotToRay: [11.2, 12.0],
} as const;

const DIAMOND = diamond(0.5, 0.5);
const WIPE = wipe('right');

function phase(t: number, [start, end]: readonly [number, number]): number {
  return Math.max(0, Math.min(1, (t - start) / (end - start)));
}

export interface HeroViewDeps {
  readonly ctx: BijouContext;
  readonly perf: () => PerfSample;
}

export function renderHero(model: HeroModel, deps: HeroViewDeps): Surface {
  const { ctx } = deps;
  const palette = compilePalette(currentSeed(model));
  const { cols: w, rows: h, time: t } = model;
  const focusId = DAG_FOCUS_ORDER.at(model.focusIndex % DAG_FOCUS_ORDER.length) ?? 'bundle';
  const title = (): Surface => titleScene(w, h, t, palette);
  const dash = (): Surface => dashboardScene(w, h, t, focusId, palette, ctx);
  const ray = (): Surface => raytraceScene(w, h, t, model.split, model.braille, deps.perf(), palette, ctx);
  const plots = (): Surface => plotScene(w, h, t, palette, ctx);

  let scene: Surface;
  if (t < TIMELINE.meltIn[1]) {
    scene = applyTransition(filled(w, h, palette.bg), title(), meltShader, phase(t, TIMELINE.meltIn), model.frame, ctx);
  } else if (t < TIMELINE.titleToDash[0]) {
    scene = title();
  } else if (t < TIMELINE.titleToDash[1]) {
    scene = applyTransition(title(), dash(), matrixShader, phase(t, TIMELINE.titleToDash), model.frame, ctx, palette.bg);
  } else if (t < TIMELINE.dashToPlot[0]) {
    scene = dash();
  } else if (t < TIMELINE.dashToPlot[1]) {
    scene = applyTransition(dash(), plots(), WIPE, phase(t, TIMELINE.dashToPlot), model.frame, ctx);
  } else if (t < TIMELINE.plotToRay[0]) {
    scene = plots();
  } else if (t < TIMELINE.plotToRay[1]) {
    scene = applyTransition(plots(), ray(), DIAMOND, phase(t, TIMELINE.plotToRay), model.frame, ctx);
  } else {
    scene = ray();
  }
  return model.palette === undefined ? scene : paletteOverlay(scene, model.palette, palette, ctx);
}

export function createHeroApp(deps: HeroViewDeps, size: { cols: number; rows: number }): App<HeroModel> {
  return {
    init: () => [createInitialModel(size.cols, size.rows), []],
    update: (msg, model) => {
      if (isKeyMsg(msg)) {
        const [next, shouldQuit] = updateKey(model, msg);
        return [next, shouldQuit ? [quit()] : []];
      }
      if (isResizeMsg(msg)) return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
      if (isPulseMsg(msg)) return [{ ...model, time: model.time + msg.dt, frame: model.frame + 1 }, []];
      return [model, []];
    },
    view: (model) => renderHero(model, deps),
  };
}
