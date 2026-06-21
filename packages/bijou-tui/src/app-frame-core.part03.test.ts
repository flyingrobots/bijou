
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createInteractiveContext,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  runFramedApp,
  runScript,
  scheduleKeys,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('feeds frame timing and budget telemetry back into shell-owned view state when using runFramedApp()', async () => {
    const { clock, ctx } = createInteractiveContext();
    scheduleKeys(ctx, clock, [
      { at: 30, key: '\x03' },
      { at: 40, key: '\x03' },
    ]);

    const promise = runFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      helpLineSource: ({ model }) => `over:${model.frameOverBudget ? 'yes' : 'no'}`,
    }, {
      ctx,
      frameBudgetMs: 0.0001,
    });

    await clock.advanceByAsync(80);
    await promise;

    expect(ctx.io.written.some((chunk) => chunk.includes('over:yes'))).toBe(true);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('rejects raw string pane renderers with an explicit migration error', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          // @ts-expect-error invalid pane fixture.
          render: () => 'invalid pane',
        }),
      }],
    });

    const [model] = app.init();
    expect(() => app.view(model)).toThrow(/Raw strings are no longer supported/);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('preserves scroll per page across tab switches', async () => {
    const app = createFramedApp({
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });

    const result = await runScript(app, [
      { key: 'j' },
      { key: 'j' },
      { key: ']' },
      { key: 'j' },
      { key: '[' },
    ]);

    expect(result.model.scrollByPage.home?.main?.y).toBe(2);
    expect(result.model.scrollByPage.logs?.main?.y).toBe(1);
  });
});
