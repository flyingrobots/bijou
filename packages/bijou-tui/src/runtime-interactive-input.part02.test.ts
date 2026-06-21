import { App, Cmd, createInteractiveContext, createTestContext, describe, expect, it, KeyMsg, mockClock, quit, run, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('sends first Ctrl+C to app as KeyMsg', async () => {
          const received: KeyMsg[] = [];
          const spyApp: App<null> = {
            init: () => [null, []],
            update(msg, model) {
              if (msg.type === 'key') received.push(msg);
              if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
              return [model, []];
            },
            view: () => textView('spy'),
          };
          // Ctrl+C then q to quit normally
          const { clock, ctx } = createInteractiveContext({
            io: { keys: ['\x03', 'q'] },
          });
          const promise = run(spyApp, { ctx });
          await clock.advanceByAsync(50);
          await promise;
          expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('does not treat the first Ctrl+C at clock time zero as a double-press', async () => {
          const clock = mockClock({ nowMs: 0 });
          const received: KeyMsg[] = [];
          const spyApp: App<null> = {
            init: () => [null, []],
            update(msg, model) {
              if (msg.type === 'key') {
                received.push(msg);
                if (msg.key === 'q') return [model, [quit()]];
              }
              return [model, []];
            },
            view: () => textView('spy'),
          };
          const ctx = createTestContext({ mode: 'interactive', clock });
          ctx.io.rawInput = (onKey) => {
            const handles = [
              clock.setTimeout(() => { onKey('\x03'); }, 0),
              clock.setTimeout(() => { onKey('q'); }, 10),
            ];
            return {
              dispose() {
                handles.forEach((handle) => {
                  handle.dispose();
                });
              },
            };
          };
          const promise = run(spyApp, { ctx });
          await clock.advanceByAsync(20);
          await promise;
          expect(received[0]).toMatchObject({ key: 'c', ctrl: true });
          expect(received.some((msg) => msg.key === 'q')).toBe(true);
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('executes startup commands from init', async () => {
          interface Msg { type: 'started' }
          const startupApp: App<string, Msg> = {
            init() {
              const cmd: Cmd<Msg> = () => ({ type: 'started' });
              return ['loading', [cmd]];
            },
            update(msg) {
              if ('type' in msg && msg.type === 'started') return ['ready', [quit<Msg>()]];
              return ['loading', []];
            },
            view: (model) => textView(model),
          };
          const { clock, ctx } = createInteractiveContext();
          const promise = run(startupApp, { ctx });
          await clock.advanceByAsync(50);
          await promise;
          const hasReady = ctx.io.written.some((w) => w.includes('ready'));
          expect(hasReady).toBe(true);
        });
  });
});
