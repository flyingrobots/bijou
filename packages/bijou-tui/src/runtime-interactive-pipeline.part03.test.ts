import { App, counterApp, createInteractiveContext, describe, EXIT_ALT_SCREEN, expect, it, run, scheduleKeys, SHOW_CURSOR, textView, WRAP_ENABLE } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('restores the terminal before rejecting when a scheduled render fails', async () => {
          const { clock, ctx } = createInteractiveContext();
          const promise = run(counterApp(), { ctx });
          const rejection = promise.catch((error: unknown) => error);

          let columns = ctx.runtime.columns;
          Object.defineProperty(ctx.runtime, 'columns', {
            configurable: true,
            get() {
              throw new Error('render exploded');
            },
            set(value: number) {
              columns = value;
            },
          });

          await clock.advanceByAsync(10);
          await expect(rejection).resolves.toBeInstanceOf(Error);
          await expect(promise).rejects.toThrow('render exploded');
          expect(columns).toBe(80);
          expect(ctx.io.written[ctx.io.written.length - 1]).toBe(
            SHOW_CURSOR + WRAP_ENABLE + EXIT_ALT_SCREEN,
          );
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('renders a crash surface and waits for enter when update throws', async () => {
          const { clock, ctx } = createInteractiveContext();
          let settled = false;
          const app: App<{ count: number }> = {
            init: () => [{ count: 3 }, []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'up') {
                throw new Error('update exploded');
              }
              return [model, []];
            },
            view: (model) => textView(`count:${String(model.count)}`),
          };

          scheduleKeys(ctx, clock, [
            { at: 5, key: '\x1b[A' },
            { at: 20, key: '\r' },
          ]);

          const promise = run(app, { ctx });
          const rejection = promise.catch((error: unknown) => error);
          void rejection.finally(() => {
            settled = true;
          });

          await clock.advanceByAsync(10);
          const written = ctx.io.written.join('');
          expect(settled).toBe(false);
          expect(written).toContain('Bijou runtime crash');
          expect(written).toContain('Phase: update');
          expect(written).toContain('update exploded');
          expect(written).toContain('Press Enter to exit.');
          expect(written).toContain('"count": 3');

          await clock.advanceByAsync(40);
          await expect(rejection).resolves.toBeInstanceOf(Error);
          await expect(promise).rejects.toThrow('update exploded');
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('renders a crash surface and waits for enter when render fails', async () => {
          const { clock, ctx } = createInteractiveContext();
          let settled = false;
          const app: App<number> = {
            init: () => [7, []],
            update: (_msg, model) => [model, []],
            view: () => {
              throw new Error('render exploded');
            },
          };

          scheduleKeys(ctx, clock, [{ at: 50, key: '\r' }]);

          const promise = run(app, { ctx });
          const rejection = promise.catch((error: unknown) => error);
          void rejection.finally(() => {
            settled = true;
          });

          await clock.advanceByAsync(20);
          const written = ctx.io.written.join('');
          expect(settled).toBe(false);
          expect(written).toContain('Bijou runtime crash');
          expect(written).toContain('Phase: render');
          expect(written).toContain('render exploded');
          expect(written).toContain('Press Enter to exit.');
          expect(written).toContain('7');

          await clock.advanceByAsync(60);
          await expect(rejection).resolves.toBeInstanceOf(Error);
          await expect(promise).rejects.toThrow('render exploded');
        });
  });
});
