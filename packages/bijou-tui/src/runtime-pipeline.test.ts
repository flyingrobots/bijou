import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type { RenderState } from './pipeline/pipeline.js';
import { RuntimeFramebuffers } from './runtime-buffers.js';
import { createRuntimePipeline } from './runtime-pipeline.js';
import { createRuntimeSession } from './runtime-startup.js';
import type { App } from './types.js';

describe('createRuntimePipeline', () => {
  it('adopts a target surface replaced by middleware', () => {
    const app: App<number> = {
      init: () => [0, []],
      update: (_message, model) => [model, []],
      view: () => createSurface(2, 1),
    };
    const session = createRuntimeSession(0);
    const buffers = new RuntimeFramebuffers(2, 1);
    const previousFront = buffers.current;
    const replacement = createSurface(2, 1);
    const pipeline = createRuntimePipeline(
      app,
      {
        configurePipeline(configured) {
          configured.use('PostProcess', (state, next) => {
            state.targetSurface = replacement;
            next();
          });
        },
      },
      session,
      buffers,
      () => ({ columns: 2, rows: 1 }),
    );
    const state: RenderState = {
      model: session.model,
      ctx: createTestContext({ mode: 'interactive' }),
      dt: session.currentDt,
      currentSurface: buffers.current,
      targetSurface: buffers.next,
      outBuf: buffers.output,
      layoutMap: new Map(),
      data: {},
    };

    pipeline.execute(state);

    expect(buffers.current === replacement).toBe(true);
    expect(buffers.next === previousFront).toBe(true);
  });
});
