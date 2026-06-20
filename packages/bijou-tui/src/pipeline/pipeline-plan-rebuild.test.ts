import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createPipeline, type RenderState } from './pipeline.js';

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

describe('pipeline plan rebuild diagnostics', () => {
  it('does not let diagnostic callback failures stop frame execution', () => {
    const log: string[] = [];
    const pipeline = createPipeline({
      onPlanRebuild: () => {
        throw new Error('diagnostic boom');
      },
    });

    pipeline.use('Layout', (_state, next) => {
      log.push('layout');
      next();
    });

    expect(() => {
      pipeline.execute(createMockState());
    }).not.toThrow();
    expect(log).toEqual(['layout']);
  });
});
