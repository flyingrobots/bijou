import { describe, it, expect } from 'vitest';
import { createPipeline, type RenderState } from './pipeline.js';
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
        const greeting = s.data['greeting'];
        s.data['greeting'] = typeof greeting === 'string' ? `${greeting} world` : greeting;
        next();
      });

      pipeline.execute(state);

      expect(state.data['greeting']).toBe('hello world');
    });

  it('halts execution if next() is not called', () => {
      const pipeline = createPipeline();
      const log: string[] = [];

      pipeline.use('Layout', (_, next) => { log.push('1'); next(); });
      pipeline.use('Paint', () => { log.push('2'); });
      pipeline.use('PostProcess', (_, next) => { log.push('3'); next(); });

      pipeline.execute(createMockState());

      expect(log).toEqual(['1', '2']);
    });

  it('catches and logs middleware errors without crashing', () => {
      const pipeline = createPipeline();
      const state = createMockState();
      const es: string[] = []; state.ctx.io.writeError = es.push.bind(es);
      const log: string[] = [];

      pipeline.use('Layout', (_, next) => { log.push('1'); next(); });
      pipeline.use('Paint', () => { throw new Error('Boom'); });
      pipeline.use('PostProcess', (_, next) => { log.push('3'); next(); });

      pipeline.execute(state);

      expect(log).toEqual(['1', '3']);
      expect(es).toEqual([expect.stringContaining('[Pipeline Error]')]);
    });

  it('diagnoses async middleware and keeps the frame moving synchronously', async () => {
      const pipeline = createPipeline();
      const state = createMockState();
      const es: string[] = []; state.ctx.io.writeError = es.push.bind(es);
      const log: string[] = [];
      let releaseAsync: (() => void) | undefined;
      const asyncGate = new Promise<void>((resolve) => {
        releaseAsync = resolve;
      });

      pipeline.use('Paint', async (_state, next) => {
        log.push('async-start');
        await asyncGate;
        log.push('async-late');
        next();
      });
      pipeline.use('PostProcess', (_state, next) => {
        log.push('post');
        next();
      });

      pipeline.execute(state);

      expect(log).toEqual(['async-start', 'post']);
      expect(es).toEqual([expect.stringContaining('Async render middleware returned a Promise in Paint')]);

      releaseAsync?.();
      await asyncGate;
      await Promise.resolve();

      expect(log).toEqual(['async-start', 'post', 'async-late']);
    });

  it('reports rejected async middleware promises without leaving an unhandled rejection', async () => {
      const pipeline = createPipeline();
      const state = createMockState();
      const es: string[] = []; state.ctx.io.writeError = es.push.bind(es);
      const log: string[] = [];

      pipeline.use('Layout', () => Promise.reject(new Error('async boom')));
      pipeline.use('Paint', (_state, next) => {
        log.push('paint');
        next();
      });

      pipeline.execute(state);
      await Promise.resolve();

      expect(log).toEqual(['paint']);
      expect(es).toContainEqual(
        expect.stringContaining('Async render middleware returned a Promise in Layout'),
      );
      expect(es).toContainEqual(
        expect.stringContaining('Async render middleware rejected in Layout'),
      );
    });
});
