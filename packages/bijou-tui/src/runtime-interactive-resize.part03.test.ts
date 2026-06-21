import { App, createInteractiveContext, describe, expect, it, quit, run, scheduleKeys, scheduleResizes, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('still rerenders on resize when update returns the same model reference', async () => {
          let viewCalls = 0;
          const app: App<number> = {
            init: () => [0, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view(model) {
              viewCalls += 1;
              return textView(`count: ${String(model)}`);
            },
          };

          const { clock, ctx } = createInteractiveContext();
          scheduleResizes(ctx, clock, [{ at: 10, columns: 100, rows: 30 }]);
          scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);

          const promise = run(app, { ctx });
          await clock.advanceByAsync(50);
          await promise;

          expect(viewCalls).toBe(2);
        });
  });
});
