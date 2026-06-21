import { App, createInteractiveContext, describe, expect, it, quit, run, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('disposes cleanup-producing commands during shutdown', async () => {
          let disposeCalls = 0;
          const dispose = () => {
            disposeCalls += 1;
          };
          const { clock, ctx } = createInteractiveContext();
          const app: App<string> = {
            init: () => ['cleanup', [() => ({ dispose }), quit()]],
            update: (_msg, model) => [model, []],
            view: (model) => textView(model),
          };

          const promise = run(app, { ctx });
          await clock.advanceByAsync(20);
          await promise;

          expect(disposeCalls).toBe(1);
        });
  });
});
