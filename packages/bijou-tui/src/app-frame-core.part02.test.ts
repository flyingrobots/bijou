
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createInteractiveContext,
  createTestContext,
  describe,
  ENABLE_MOUSE,
  expect,
  expectTypeOf,
  it,
  makePage,
  scheduleKeys,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  FramePageMsg,
  FramedApp,
  FramedAppMsg,
  FramedAppUpdateResult,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('preserves framed message typing through shell composition', () => {
    type TypedMsg =
      | { type: 'select'; value: string }
      | { type: 'refresh' };

    interface TypedPageModel {
      readonly selected?: string;
    }

    const page: FramePage<TypedPageModel, TypedMsg> = {
      id: 'typed',
      title: 'Typed',
      init: () => [{ selected: undefined }, []],
      update(msg, model) {
        expectTypeOf(msg).toEqualTypeOf<FramePageMsg<TypedMsg>>();
        if (msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
        if (msg.type === 'select') return [{ selected: msg.value }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('typed'),
      }),
    };

    const app = createFramedApp({
      pages: [page],
    });
    const [model] = app.init();
    const result = app.update({ type: 'select', value: 'alpha' }, model);

    expectTypeOf(app).toEqualTypeOf<FramedApp<TypedPageModel, TypedMsg>>();
    expectTypeOf(result).toEqualTypeOf<FramedAppUpdateResult<TypedPageModel, TypedMsg>>();
    expectTypeOf(result[1]).toEqualTypeOf<Cmd<FramedAppMsg<TypedMsg>>[]>();
    expect(result[0].pageModels.typed?.selected).toBe('alpha');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('exposes a self-running hosted runner for framed apps and enables mouse input by default', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const { clock, ctx } = createInteractiveContext();
    scheduleKeys(ctx, clock, [
      { at: 10, key: '\x03' },
      { at: 20, key: '\x03' },
    ]);

    const promise = app.run({ ctx });
    await clock.advanceByAsync(60);
    await promise;

    expect(ctx.io.written).toContain(ENABLE_MOUSE);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('rejects concurrent hosted runs on the same framed app instance', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const { clock, ctx } = createInteractiveContext();
    scheduleKeys(ctx, clock, [
      { at: 20, key: '\x03' },
      { at: 30, key: '\x03' },
    ]);

    const firstRun = app.run({ ctx });
    await expect(app.run({ ctx })).rejects.toThrow(
      'createFramedApp: concurrent app.run() calls on the same framed app are not supported',
    );

    await clock.advanceByAsync(80);
    await firstRun;
  });
});
