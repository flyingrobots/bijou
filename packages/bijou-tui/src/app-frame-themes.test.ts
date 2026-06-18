import {
  activeFrameLayer,
  activeRuntimeView,
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  createTestContext,
  describe,
  describeFrameLayerStack,
  describeFrameRuntimeViewStack,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makeLongContent,
  makeModalPage,
  makePage,
  normalizeViewOutput,
  projectFrameControls,
  QUIT,
  runScript,
  setDefaultContext,
  surfaceToString,
  textView,
  underlyingFrameLayer,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';
import { createCommandPaletteState } from './command-palette.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('supports richer explicit layer titles and control sources for shell introspection', () => {
    const workspaceHelp = createKeyMap<{ type: 'noop' }>()
      .bind('tab', 'Next pane', { type: 'noop' });
    const settingsHelp = createKeyMap<{ type: 'noop' }>()
      .bind('escape', 'Close settings', { type: 'noop' });
    const searchHelp = createKeyMap<{ type: 'noop' }>()
      .bind('enter', 'Select', { type: 'noop' });

    const model = {
      helpOpen: false,
      commandPalette: createCommandPaletteState([]),
      commandPaletteKind: 'search' as const,
      settingsOpen: true,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
    };

    const stack = describeFrameLayerStack(model, {
      layers: {
        workspace: {
          title: 'Workspace',
          hintSource: 'Tab next pane',
          helpSource: workspaceHelp,
        },
        settings: {
          title: 'Workspace settings',
          hintSource: 'F2/Esc close',
          helpSource: settingsHelp,
        },
        search: {
          title: 'Search components',
          hintSource: 'Enter select • Esc close',
          helpSource: searchHelp,
        },
      },
    });

    expect(stack.map((layer) => ({ kind: layer.kind, title: layer.title }))).toEqual([
      { kind: 'workspace', title: 'Workspace' },
      { kind: 'settings', title: 'Workspace settings' },
      { kind: 'search', title: 'Search components' },
    ]);
    expect(activeFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })).toMatchObject({
      kind: 'search',
      title: 'Search components',
      hintSource: 'Enter select • Esc close',
      inputMapId: 'frame-search',
    });
    expect(underlyingFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })).toMatchObject({
      kind: 'settings',
      title: 'Workspace settings',
      hintSource: 'F2/Esc close',
      inputMapId: 'frame-settings',
    });
    expect(underlyingFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })?.helpSource).toBe(settingsHelp);
  });

  it('projects footer and help controls from the explicit frame layer stack', () => {
    const workspaceHelp = createKeyMap<{ type: 'noop' }>()
      .bind('tab', 'Next pane', { type: 'noop' });
    const settingsHelp = createKeyMap<{ type: 'noop' }>()
      .bind('enter', 'Apply settings', { type: 'noop' });

    const projection = projectFrameControls({
      helpOpen: true,
      commandPalette: undefined,
      commandPaletteKind: undefined,
      settingsOpen: true,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
    }, {
      layers: {
        workspace: {
          title: 'Workspace',
          hintSource: 'Tab next pane',
          helpSource: workspaceHelp,
        },
        settings: {
          title: 'Workspace settings',
          hintSource: 'F2/Esc close',
          helpSource: settingsHelp,
        },
        help: {
          title: 'Keyboard Help',
          hintSource: 'j/k scroll • Esc close',
        },
      },
    });

    expect(projection.layerStack.map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);
    expect(projection.activeLayer).toMatchObject({
      kind: 'help',
      title: 'Keyboard Help',
      hintSource: 'j/k scroll • Esc close',
    });
    expect(projection.underlyingLayer).toMatchObject({
      kind: 'settings',
      title: 'Workspace settings',
    });
    expect(projection.footerHintSource).toBe('j/k scroll • Esc close');
    expect(projection.helpSource).toBe(settingsHelp);
  });

  it('backs frame layer introspection with a runtime view stack', () => {
    const workspaceHelp = createKeyMap<{ type: 'noop' }>()
      .bind('tab', 'Next pane', { type: 'noop' });
    const settingsHelp = createKeyMap<{ type: 'noop' }>()
      .bind('escape', 'Close settings', { type: 'noop' });
    const searchHelp = createKeyMap<{ type: 'noop' }>()
      .bind('enter', 'Select', { type: 'noop' });

    const model = {
      helpOpen: false,
      commandPalette: createCommandPaletteState([]),
      commandPaletteKind: 'search' as const,
      settingsOpen: true,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
    };

    const stack = describeFrameRuntimeViewStack(model, {
      layers: {
        workspace: {
          title: 'Workspace',
          helpSource: workspaceHelp,
        },
        settings: {
          title: 'Workspace settings',
          hintSource: 'F2/Esc close',
          helpSource: settingsHelp,
        },
        search: {
          title: 'Search components',
          hintSource: 'Enter select • Esc close',
          helpSource: searchHelp,
        },
      },
    });

    expect(stack.layers.map((layer) => ({
      root: layer.root,
      kind: layer.kind,
      dismissible: layer.dismissible,
      blocksBelow: layer.blocksBelow,
      title: layer.model?.title,
    }))).toEqual([
      {
        root: true,
        kind: 'workspace',
        dismissible: false,
        blocksBelow: false,
        title: 'Workspace',
      },
      {
        root: false,
        kind: 'settings',
        dismissible: true,
        blocksBelow: true,
        title: 'Workspace settings',
      },
      {
        root: false,
        kind: 'search',
        dismissible: true,
        blocksBelow: true,
        title: 'Search components',
      },
    ]);

    expect(activeRuntimeView(stack)?.model).toMatchObject({
      kind: 'search',
      title: 'Search components',
      hintSource: 'Enter select • Esc close',
      inputMapId: 'frame-search',
    });
  });

  it('shows settings controls in help when help opens above settings', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Workspace settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);

    expect(model.settingsOpen).toBe(true);
    expect(model.helpOpen).toBe(true);
    expect(describeFrameLayerStack(model).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);

    const rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );

    expect(rendered).toContain('Close settings');
    expect(rendered).not.toContain('Increment');
  });

  it('uses page-provided layer registry metadata for workspace and page-modal control projection', async () => {
    const workspaceHelp = createKeyMap<Msg>()
      .bind('enter', 'Open workspace command', { type: 'noop' });
    const modalHelp = createKeyMap<Msg>()
      .bind('enter', 'Apply modal action', { type: 'noop' });
    const page: FramePage<PageModel, Msg> = {
      ...makeModalPage('home', 'Home', 'main'),
      layers(model) {
        return {
          workspace: {
            title: 'Home workspace',
            hintSource: 'Workspace custom hint',
            helpSource: workspaceHelp,
          },
          'page-modal': model.modalOpen
            ? {
                title: 'Inspector',
                hintSource: 'Modal custom hint',
                helpSource: modalHelp,
              }
            : undefined,
        };
      },
    };
    const app = createFramedApp({
      pages: [page],
    });

    let [model] = app.init();
    let rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Workspace custom hint');

    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Open workspace command');
    expect(rendered).not.toContain('Apply modal action');

    model = (await runScript(app, [{ key: 'm' }])).model;
    rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Modal custom hint');
  });

  it('quits in pipe mode instead of opening quit confirm', async () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    setDefaultContext(pipeCtx);
    try {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
      });

      const [model] = app.init();
      const [nextModel, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect(nextModel.quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(1);

      const returned = await cmds[0]?.(() => undefined, {
        onPulse() {
          return { dispose: () => undefined };
        },
      });
      expect(returned).toBe(QUIT);
    } finally {
      setDefaultContext(testCtx);
    }
  });

  it('focuses the hovered pane and scrolls it with the mouse wheel', async () => {
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left')) },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right')) },
      }),
    };

    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 20,
      pages: [splitPage],
    });

    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'none',
        action: 'scroll-down',
        col: 60,
        row: 6,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);

    expect(result.model.focusedPaneByPage.home).toBe('right');
    expect(result.model.scrollByPage.home?.right?.y).toBe(1);
  });

  it('reuses the last rendered workspace layout when routing mouse wheel input', () => {
    let layoutCalls = 0;
    const splitPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => {
        layoutCalls += 1;
        return {
          kind: 'split',
          splitId: 's1',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left')) },
          paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right')) },
        };
      },
    };

    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 20,
      pages: [splitPage],
    });

    const [model] = app.init();
    expect(layoutCalls).toBe(1);

    app.view(model);
    expect(layoutCalls).toBe(2);

    const [nextModel] = app.update({
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 60,
      row: 6,
      shift: false,
      alt: false,
      ctrl: false,
    }, model);

    expect(nextModel.focusedPaneByPage.home).toBe('right');
    expect(nextModel.scrollByPage.home?.right?.y).toBe(1);
    expect(layoutCalls).toBe(3);

    app.view(nextModel);
    expect(layoutCalls).toBe(4);
  });

  it('opens command palette and dispatches selected keymap command', async () => {
    const global = createKeyMap<Msg>()
      .bind('z', 'Zap', { type: 'inc' });

    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      globalKeys: global,
      enableCommandPalette: true,
    });

    // Ctrl+P opens palette. Type "z" to filter to Zap, then Enter.
    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 'z' },
      { key: KEY_ENTER },
    ]);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.commandPalette).toBeUndefined();
  });
});
