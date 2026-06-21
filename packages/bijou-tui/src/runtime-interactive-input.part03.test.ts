import { App, Cmd, createInteractiveContext, createSurface, describe, expect, it, quit, run, scheduleKeys, textView } from './runtime.test-support.js';

describe('run', () => {
  describe('interactive mode', () => {
    it('routes rejected commands through the app runtime issue hook', async () => {
          interface Msg { type: 'issue'; text: string }
          const seenIssues: string[] = [];
          const rejectingApp: App<string, Msg> = {
            init() {
              const rejectCmd: Cmd<Msg> = () => Promise.reject(new Error('boom'));
              return ['idle', [rejectCmd]];
            },
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') {
                return [model, [quit<Msg>()]];
              }
              if ('type' in msg && msg.type === 'issue') {
                seenIssues.push(msg.text);
                return [`issue:${msg.text}`, []];
              }
              return ['idle', []];
            },
            view: (model) => textView(model),
            routeRuntimeIssue(issue) {
              return { type: 'issue', text: `${issue.source}:${issue.message}` };
            },
          };
          const { clock, ctx } = createInteractiveContext();
          scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
          const promise = run(rejectingApp, { ctx });
          await clock.advanceByAsync(100);
          await promise;
          expect(ctx.io.writtenErr.some((chunk) => chunk.includes('[EventBus] Command rejected: Error: boom'))).toBe(true);
          expect(seenIssues).toContain('command:Error: boom');
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('routes opt-in surface budget warnings through the app runtime issue hook', async () => {
          interface Msg { type: 'issue'; text: string }
          const seenIssues: string[] = [];
          const budgetedApp: App<string, Msg> = {
            init: () => ['idle', []],
            update(msg, model) {
              if (msg.type === 'key' && msg.key === 'q') {
                return [model, [quit<Msg>()]];
              }
              if (msg.type === 'issue') {
                seenIssues.push(msg.text);
                return [`issue:${msg.text}`, []];
              }
              return [model, []];
            },
            view() {
              return createSurface(4, 4, { char: '.', empty: false });
            },
            routeRuntimeIssue(issue) {
              return {
                type: 'issue',
                text: `${issue.level}:${issue.source}:${issue.message}`,
              };
            },
          };
          const { clock, ctx } = createInteractiveContext({ runtime: { columns: 4, rows: 4 } });
          scheduleKeys(ctx, clock, [{ at: 20, key: 'q' }]);
          const promise = run(budgetedApp, {
            ctx,
            surfaceBudget: { maxArea: 1 },
          });
          await clock.advanceByAsync(100);
          await promise;
          expect(seenIssues).toContain('warning:runtime:surface surface-area 16 > 1');
        });
  });
});

describe('run', () => {
  describe('interactive mode', () => {
    it('runs init commands before startup resize commands', async () => {
          type Msg = { type: 'init-cmd' } | { type: 'resize-cmd' };
          const order: string[] = [];
          const orderingApp: App<null, Msg> = {
            init() {
              const initCmd: Cmd<Msg> = () => ({ type: 'init-cmd' });
              return [null, [initCmd]];
            },
            update(msg, model) {
              if (msg.type === 'resize') {
                const resizeCmd: Cmd<Msg> = () => ({ type: 'resize-cmd' });
                return [model, [resizeCmd]];
              }
              if (msg.type === 'init-cmd') order.push('init');
              if (msg.type === 'resize-cmd') order.push('resize');
              if (order.length >= 2) return [model, [quit<Msg>()]];
              return [model, []];
            },
            view: () => textView('ordering'),
          };
          const { clock, ctx } = createInteractiveContext();
          const promise = run(orderingApp, { ctx });
          await clock.advanceByAsync(50);
          await promise;
          expect(order).toEqual(['init', 'resize']);
        });
  });
});
