import { describe, it, expect, vi } from 'vitest';
import { createPipeline, type RenderState } from './pipeline.js';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('createPipeline', () => {
  function createMockState(): RenderState {
    return {
      model: {},
      ctx: createTestContext(),
      currentSurface: createSurface(10, 10),
      targetSurface: createSurface(10, 10),
      layoutMap: new Map(),
      data: {},
    };
  }

  it('executes middleware in stage order', () => {
    const pipeline = createPipeline();
    const log: string[] = [];

    pipeline.use('Diff', (_, next) => { log.push('Diff'); next(); });
    pipeline.use('Layout', (_, next) => { log.push('Layout'); next(); });
    pipeline.use('PostProcess', (_, next) => { log.push('PostProcess'); next(); });
    pipeline.use('Paint', (_, next) => { log.push('Paint'); next(); });
    pipeline.use('Output', (_, next) => { log.push('Output'); next(); });

    pipeline.execute(createMockState());

    expect(log).toEqual(['Layout', 'Paint', 'PostProcess', 'Diff', 'Output']);
  });

  it('shares state between middleware', () => {
    const pipeline = createPipeline();
    const state = createMockState();

    pipeline.use('Layout', (s, next) => {
      s.data['greeting'] = 'hello';
      next();
    });

    pipeline.use('Paint', (s, next) => {
      s.data['greeting'] += ' world';
      next();
    });

    pipeline.execute(state);

    expect(state.data['greeting']).toBe('hello world');
  });

  it('halts execution if next() is not called', () => {
    const pipeline = createPipeline();
    const log: string[] = [];

    pipeline.use('Layout', (_, next) => { log.push('1'); next(); });
    pipeline.use('Paint', () => { log.push('2'); /* HALT */ });
    pipeline.use('PostProcess', (_, next) => { log.push('3'); next(); });

    pipeline.execute(createMockState());

    expect(log).toEqual(['1', '2']);
  });

  it('catches and logs middleware errors without crashing', () => {
    const pipeline = createPipeline();
    const state = createMockState();
    state.ctx.io.writeError = vi.fn();
    const log: string[] = [];

    pipeline.use('Layout', (_, next) => { log.push('1'); next(); });
    pipeline.use('Paint', () => { throw new Error('Boom'); });
    pipeline.use('PostProcess', (_, next) => { log.push('3'); next(); });

    pipeline.execute(state);

    expect(log).toEqual(['1', '3']); // Continued after error
    expect(state.ctx.io.writeError).toHaveBeenCalledWith(expect.stringContaining('[Pipeline Error]'));
  });
});
