import {
  afterAll,
  beforeAll,
  collectCommandMessages,
  createFramedApp,
  createInteractiveContext,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  describe,
  ENABLE_MOUSE,
  expect,
  expectTypeOf,
  it,
  KEY_DOWN,
  KEY_SHIFT_TAB,
  KEY_TAB,
  makePage,
  mockClock,
  normalizeViewOutput,
  runFramedApp,
  runScript,
  scheduleKeys,
  setDefaultContext,
  stringToSurface,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  FramePageMsg,
  FramedApp,
  FramedAppMsg,
  FramedAppUpdateResult,
  Msg,
  PageModel,
  PageTransition,
  Surface,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('switches tabs with [ and ]', async () => {
    const app = createFramedApp({
      title: 'Test',
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });

    const result = await runScript(app, [{ key: ']' }]);
    expect(result.model.activePageId).toBe('logs');
  });

  it('supports pane renderers that return a Surface', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => stringToSurface('surface-pane', 12, 1),
        }),
      }],
    });

    const result = await runScript(app, []);
    expect(surfaceToString(result.frames.at(-1)!, testCtx.style)).toContain('surface-pane');
  });

  it('supports pane renderers that return a LayoutNode', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => ({
            type: 'PaneNode',
            rect: { x: 0, y: 0, width: 11, height: 1 },
            children: [],
            surface: stringToSurface('layout-pane', 11, 1),
          }),
        }),
      }],
    });

    const result = await runScript(app, []);
    expect(surfaceToString(result.frames.at(-1)!, testCtx.style)).toContain('layout-pane');
  });

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
          render: () => 'string panes are no longer valid' as unknown as any,
        }),
      }],
    });

    const [model] = app.init();
    expect(() => app.view(model)).toThrow(/Raw strings are no longer supported/);
  });

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

  it('cycles pane focus with tab and shift+tab', async () => {
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
    };

    const app = createFramedApp({ pages: [splitPage] });
    const result = await runScript(app, [{ key: KEY_TAB }, { key: KEY_SHIFT_TAB }]);
    expect(result.model.focusedPaneByPage.home).toBe('left');
  });

  it('routes pane keymaps only to the focused pane', async () => {
    type PaneMsg = { type: 'left-hit' } | { type: 'right-hit' };
    interface PaneModel {
      leftHits: number;
      rightHits: number;
    }

    const page: FramePage<PaneModel, PaneMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ leftHits: 0, rightHits: 0 }, []],
      update(msg, model) {
        if (msg.type === 'left-hit') return [{ ...model, leftHits: model.leftHits + 1 }, []];
        if (msg.type === 'right-hit') return [{ ...model, rightHits: model.rightHits + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
      inputAreas: () => [
        {
          paneId: 'left',
          keyMap: createKeyMap<PaneMsg>().bind('down', 'Left hit', { type: 'left-hit' }),
        },
        {
          paneId: 'right',
          keyMap: createKeyMap<PaneMsg>().bind('down', 'Right hit', { type: 'right-hit' }),
        },
      ],
    };

    const app = createFramedApp({ pages: [page] });
    const result = await runScript(app, [
      { key: KEY_DOWN },
      { key: KEY_TAB },
      { key: KEY_DOWN },
    ]);

    expect(result.model.pageModels.home?.leftHits).toBe(1);
    expect(result.model.pageModels.home?.rightHits).toBe(1);
    expect(result.model.focusedPaneByPage.home).toBe('right');
  });

  it('keeps the footer visible while repeated Tab gestures traverse panes', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
    };
    const app = createFramedApp({
      title: 'Test',
      pages: [page],
    });
    const tab = { type: 'key' as const, key: 'tab', ctrl: false, alt: false, shift: false };

    const [model] = app.init();
    const [afterSingleTab, singleTabCmds] = app.update(tab, model);

    expect(afterSingleTab.focusedPaneByPage.home).toBe('right');
    expect(afterSingleTab.footerVisible).toBe(true);
    expect(afterSingleTab.footerTranslateY).toBe(0);
    expect(singleTabCmds).toHaveLength(0);

    const [afterRepeatedTab, repeatedTabCmds] = app.update(tab, afterSingleTab);

    expect(afterRepeatedTab.focusedPaneByPage.home).toBe('left');
    expect(afterRepeatedTab.footerVisible).toBe(true);
    expect(afterRepeatedTab.footerTranslateY).toBe(0);
    expect(repeatedTabCmds).toHaveLength(0);
    expect(surfaceToString(
      normalizeViewOutput(
        app.view(afterRepeatedTab),
        { width: afterRepeatedTab.columns, height: afterRepeatedTab.rows },
      ).surface,
      testCtx.style,
    )).toContain('[NORMAL]');
  });

  it('triggers transition animation when switching tabs', async () => {
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'wipe',
      transitionDuration: 10,
    });

    const [initModel] = app.init();
    expect(initModel.activePageId).toBe('p1');

    // Trigger tab switch
    const [switchedModel, switchCmds] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    expect(switchedModel.activePageId).toBe('p2');
    expect(switchedModel.previousPageId).toBe('p1');
    expect(switchedModel.transitionProgress).toBe(0);
    expect(switchCmds.length).toBe(1);

    const transitionCmd = switchCmds[0];
    if (transitionCmd == null) {
      throw new Error('expected transition command');
    }
    const messages = await collectCommandMessages(
      transitionCmd,
      Array.from({ length: 10 }, () => 0.002),
    );

    expect(messages.length).toBeGreaterThan(0);

    let model = switchedModel;
    for (const m of messages) {
      const [nextModel] = app.update(m, model);
      model = nextModel;
    }

    expect(model.activePageId).toBe('p2');
    expect(model.previousPageId).toBeUndefined();
    expect(model.transitionProgress).toBe(1);
  });

  it('runs transition animation through runScript', async () => {
    const clock = mockClock();
    const ctx = createTestContext({ clock });
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'fade',
      transitionDuration: 20,
    });

    const promise = runScript(app, [
      { key: ']' },
    ], { ctx });
    await clock.advanceByAsync(200);
    const result = await promise;

    expect(result.model.activePageId).toBe('p2');
    expect(result.model.previousPageId).toBeUndefined();
    expect(result.model.transitionProgress).toBe(1);
    // Transition emits frames, so we expect more than just the keypress frame
    expect(result.frames.length).toBeGreaterThan(1);
  });

  it('renders complex transition styles (melt, matrix, scramble) without error', async () => {
    const transitions: PageTransition[] = ['melt', 'matrix', 'scramble'];
    
    for (const transition of transitions) {
      const clock = mockClock();
      const ctx = createTestContext({ clock });
      const app = createFramedApp({
        pages: [
          makePage('p1', 'P1', 'm'),
          makePage('p2', 'P2', 'm'),
        ],
        transition,
        transitionDuration: 10,
      });

      const promise = runScript(app, [
        { key: ']' },
      ], { ctx });
      await clock.advanceByAsync(100);
      const result = await promise;

      expect(result.model.activePageId).toBe('p2');
      expect(result.model.transitionProgress).toBe(1);
    }
  });
});
