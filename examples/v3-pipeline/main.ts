import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface } from '@flyingrobots/bijou';
import { isKeyMsg, quit, run, type App, type RenderPipeline, vstackSurface } from '@flyingrobots/bijou-tui';
import { centerSurface, line, spacer } from '../_shared/example-surfaces.ts';

export const ctx = initDefaultContext();

interface Model {
  scanlineOn: boolean;
}

export const app: App<Model> = {
  init: () => [{ scanlineOn: true }, []],
  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === ' ') return [{ ...model, scanlineOn: !model.scanlineOn }, []];
    }
    return [model, []];
  },
  view: (model) => centerSurface(
    ctx,
    boxSurface(
      vstackSurface(
        badge('Pipeline Hook', { variant: 'primary' }),
        spacer(1, 1),
        line('This app installs a custom PostProcess middleware.'),
        line(`Scanlines: ${model.scanlineOn ? 'enabled' : 'disabled'}`),
        spacer(1, 1),
        line('Press SPACE to toggle the effect. Press Q to quit.'),
      ),
      { title: 'Render Pipeline', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
    ),
  ),
};

function pipelineModel(model: unknown): Model {
  if (typeof model !== 'object' || model === null || !('scanlineOn' in model) || typeof model.scanlineOn !== 'boolean') {
    throw new Error('v3-pipeline expected scanline model');
  }
  return model;
}

export function configureScanlinePipeline(pipeline: RenderPipeline): void {
  pipeline.use('PostProcess', (state, next) => {
    const enabled = pipelineModel(state.model).scanlineOn;
    if (enabled) {
      for (let y = 1; y < state.targetSurface.height; y += 2) {
        for (let x = 0; x < state.targetSurface.width; x++) {
          const cell = state.targetSurface.get(x, y);
          if (cell.empty) continue;
          const modifiers = new Set(cell.modifiers ?? []);
          modifiers.add('dim');
          state.targetSurface.set(x, y, { ...cell, modifiers: Array.from(modifiers) });
        }
      }
    }
    next();
  });
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void run(app, {
    ctx,
    configurePipeline: configureScanlinePipeline,
  });
}
