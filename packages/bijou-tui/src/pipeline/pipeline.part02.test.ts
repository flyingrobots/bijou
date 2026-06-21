import { describe, it, expect } from 'vitest';
import { createPipeline, getRenderStageTimings, type RenderState } from './pipeline.js';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('createPipeline', () => {
  function createMockState(): RenderState {
      return {
        model: {},
        ctx: createTestContext(),
        dt: 0,
        currentSurface: createSurface(10, 10),
        targetSurface: createSurface(10, 10),
        layoutMap: new Map(),
        data: {},
      };
    }

  it('reuses the flattened chain until middleware registration changes', () => {
      let planBuilds = 0;
      const pipeline = createPipeline({ onPlanRebuild: () => { planBuilds += 1; } });
      const log: string[] = [];

      pipeline.use('Layout', (_, next) => { log.push('layout'); next(); });
      pipeline.use('Paint', (_, next) => { log.push('paint'); next(); });

      pipeline.execute(createMockState());
      pipeline.execute(createMockState());

      expect(planBuilds).toBe(1);
      expect(log).toEqual(['layout', 'paint', 'layout', 'paint']);

      pipeline.use('PostProcess', (_, next) => { log.push('post'); next(); });
      pipeline.execute(createMockState());

      expect(planBuilds).toBe(2);
      expect(log).toEqual([
        'layout', 'paint',
        'layout', 'paint',
        'layout', 'paint', 'post',
      ]);

    });

  it('records per-stage timings and notifies observers in stage order', () => {
      let nowMs = 100;
      const pipeline = createPipeline({ now: () => nowMs });
      const state = createMockState();
      const seen: { stage: string; durationMs: number }[] = [];

      pipeline.use('Layout', (_state, next) => {
        nowMs += 5;
        next();
      });
      pipeline.use('Paint', (_state, next) => {
        nowMs += 7;
        next();
      });
      pipeline.use('Diff', (_state, next) => {
        nowMs += 11;
        next();
      });

      pipeline.onStageComplete((stage, durationMs) => {
        seen.push({ stage, durationMs });
      });

      pipeline.execute(state);

      expect(seen).toEqual([
        { stage: 'Layout', durationMs: 5 },
        { stage: 'Paint', durationMs: 7 },
        { stage: 'PostProcess', durationMs: 0 },
        { stage: 'Diff', durationMs: 11 },
        { stage: 'Output', durationMs: 0 },
      ]);
      expect(getRenderStageTimings(state)).toEqual(seen);
    });

  it('records the active stage timing when middleware halts the pipeline', () => {
      let nowMs = 0;
      const pipeline = createPipeline({ now: () => nowMs });
      const state = createMockState();

      pipeline.use('Layout', (_state, next) => {
        nowMs += 3;
        next();
      });
      pipeline.use('Paint', () => {
        nowMs += 9;
      });
      pipeline.use('PostProcess', (_state, next) => {
        nowMs += 100;
        next();
      });

      pipeline.execute(state);

      expect(getRenderStageTimings(state)).toEqual([
        { stage: 'Layout', durationMs: 3 },
        { stage: 'Paint', durationMs: 9 },
      ]);
    });
});
