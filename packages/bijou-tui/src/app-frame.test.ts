import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, mockClock, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { setDefaultContext, stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { createKeyMap } from './keybindings.js';
import { createSplitPaneState } from './split-pane.js';
import { runScript } from './driver.js';
import { createFramedApp, type FramePage, type FrameOverlayContext, type PageTransition } from './app-frame.js';
import { QUIT, type Cmd, type MouseMsg } from './types.js';
import { tick } from './commands.js';

type Msg =
  | { type: 'inc' }
  | { type: 'noop' };

interface PageModel {
  count: number;
}

const KEY_TAB = '\t';
const KEY_SHIFT_TAB = '\x1b[Z';
const KEY_ESCAPE = '\x1b';
const KEY_CTRL_P = '\x10';
const KEY_ENTER = '\r';

function makeLongContent(label: string, lines = 40): string {
  return Array.from({ length: lines }, (_, i) => `${label} line ${i}`).join('\n');
}

function makePage(id: string, title: string, paneId: string): FramePage<PageModel, Msg> {
  return {
    id,
    title,
    init: () => [{ count: 0 }, []],
    update(msg, model) {
      if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
      return [model, []];
    },
    layout: () => ({
      kind: 'pane',
      paneId,
      render: () => makeLongContent(`${id}:${paneId}`),
    }),
    keyMap: createKeyMap<Msg>()
      .bind('x', 'Increment', { type: 'inc' }),
  };
}

describe('createFramedApp', () => {
  // Ensure a context is available for components that resolve it from the singleton
  const testCtx = createTestContext();
  beforeAll(() => setDefaultContext(testCtx));
  afterAll(() => _resetDefaultContextForTesting());

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
        paneA: { kind: 'pane', paneId: 'left', render: () => 'left' },
        paneB: { kind: 'pane', paneId: 'right', render: () => 'right' },
      }),
    };

    const app = createFramedApp({ pages: [splitPage] });
    const result = await runScript(app, [{ key: KEY_TAB }, { key: KEY_SHIFT_TAB }]);
    expect(result.model.focusedPaneByPage.home).toBe('left');
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

    const [initModel, initCmds] = app.init();
    expect(initModel.activePageId).toBe('p1');

    // Trigger tab switch
    const [switchedModel, switchCmds] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    expect(switchedModel.activePageId).toBe('p2');
    expect(switchedModel.previousPageId).toBe('p1');
    expect(switchedModel.transitionProgress).toBe(0);
    expect(switchCmds.length).toBe(1);

    // Manually drive the animation command
    const messages: any[] = [];
    const pulseHandlers = new Set<(dt: number) => void>();
    let settled = false;
    const promise = switchCmds[0]!((m) => messages.push(m), {
      onPulse(handler) {
        pulseHandlers.add(handler);
        return {
          dispose() {
            pulseHandlers.delete(handler);
          },
        };
      },
    }).then(() => {
      settled = true;
    });

    for (let i = 0; i < 10 && !settled; i++) {
      for (const handler of [...pulseHandlers]) {
        handler(0.002);
      }
      await Promise.resolve();
    }

    await promise;

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

  it('respects transitionOverride to select animation dynamically', async () => {
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'none',
      transitionOverride: () => 'wipe',
      transitionDuration: 10,
    });

    const [initModel] = app.init();
    const [switchedModel] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    
    // Even though transition: 'none' was set, override should win
    expect(switchedModel.activeTransition).toBe('wipe');
    expect(switchedModel.transitionProgress).toBe(0);
  });

  it('throws for duplicate pane ids in a page layout', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'split',
          splitId: 'dup',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'main', render: () => 'left' },
          paneB: { kind: 'pane', paneId: 'main', render: () => 'right' },
        }),
      }],
    });

    expect(() => app.init()).toThrow(/duplicate paneId "main"/);
  });

  it('collects pane ids from declared grid areas only', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'grid',
          gridId: 'g',
          columns: ['1fr'],
          rows: ['1fr'],
          areas: ['main'],
          cells: {
            main: { kind: 'pane', paneId: 'main', render: () => 'main' },
            ghost: { kind: 'pane', paneId: 'ghost', render: () => 'ghost' },
          },
        }),
      }],
    });

    const [model] = app.init();
    expect(model.focusedPaneByPage.home).toBe('main');
    expect(model.scrollByPage.home?.ghost).toBeUndefined();
  });

  it('dispatches page keymap actions into page update', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: 'x' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
  });

  it('can prefer page key bindings over frame scroll bindings', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => makeLongContent('home:main'),
      }),
      keyMap: createKeyMap<Msg>().bind('l', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp({
      pages: [page],
      keyPriority: 'page-first',
    });

    const result = await runScript(app, [{ key: 'l' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.scrollByPage.home?.main?.x ?? 0).toBe(0);
  });

  it('can override the short help strip with page bindings only', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => 'home',
      }),
      keyMap: createKeyMap<Msg>()
        .bind('l', 'Cycle placement', { type: 'inc' })
        .bind('q', 'Quit demo', { type: 'noop' }),
    };

    const app = createFramedApp({
      title: 'Test',
      pages: [page],
      helpLineSource: ({ activePage }) => activePage.keyMap,
    });

    const result = await runScript(app, []);
    const frame = surfaceToString(result.frames.at(-1)!, testCtx.style);

    expect(frame).toContain('l Cycle placement');
    expect(frame).toContain('q Quit demo');
    expect(frame).not.toContain('[ Previous tab');
    expect(frame).not.toContain('Tab Next pane');
  });

  it('keeps init command messages scoped to their originating page', async () => {
    const initInc: Cmd<Msg> = async () => ({ type: 'inc' });
    const page = (id: string, title: string): FramePage<PageModel, Msg> => ({
      id,
      title,
      init: () => [{ count: 0 }, [initInc]],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => `${id} pane`,
      }),
    });

    const app = createFramedApp({
      pages: [page('home', 'Home'), page('logs', 'Logs')],
    });
    const result = await runScript(app, []);

    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.pageModels.logs?.count).toBe(1);
  });

  it('routes delayed page commands back to the originating page after tab switches', async () => {
    const home: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => 'home',
      }),
    };

    const logs: FramePage<PageModel, Msg> = {
      id: 'logs',
      title: 'Logs',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        if (msg.type === 'noop') {
          return [model, [tick(10, { type: 'inc' })]];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => 'logs',
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Delayed increment', { type: 'noop' }),
    };

    const app = createFramedApp({
      pages: [home, logs],
    });

    let [model, initCmds] = app.init();
    expect(initCmds).toHaveLength(0);

    let update = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('logs');

    update = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    const noopCmd = update[1][0];
    expect(noopCmd).toBeDefined();

    const noopResult = await noopCmd!(() => {}, {
      onPulse: () => ({ dispose() {} }),
    });
    expect(noopResult).toBeDefined();
    expect(noopResult).not.toBe(QUIT);

    update = app.update(noopResult as Msg, model);
    model = update[0];
    const delayedCmd = update[1][0];
    expect(delayedCmd).toBeDefined();

    const emitted: Msg[] = [];
    const delayedPromise = delayedCmd!((msg) => emitted.push(msg), {
      onPulse: () => ({ dispose() {} }),
      sleep: () => Promise.resolve(),
    });

    update = app.update({ type: 'key', key: '[', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('home');

    const returned = await delayedPromise;
    for (const msg of emitted) {
      update = app.update(msg, model);
      model = update[0];
    }
    if (returned !== undefined && returned !== QUIT) {
      update = app.update(returned, model);
      model = update[0];
    }

    expect(model.pageModels.home?.count).toBe(0);
    expect(model.pageModels.logs?.count).toBe(1);
  });

  it('supports Shift+G for scroll-to-bottom', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: 'G' }]);
    expect(result.model.scrollByPage.home?.main?.y).toBeGreaterThan(0);
  });

  it('ignores mouse messages at the frame boundary', async () => {
    type MsgWithMouse = Msg | MouseMsg;

    let sawMouseInPageUpdate = false;
    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          sawMouseInPageUpdate = true;
          return [model, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => 'main',
      }),
      keyMap: createKeyMap<MsgWithMouse>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({ pages: [page] });
    const mouse: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 4,
      row: 2,
      shift: false,
      alt: false,
      ctrl: false,
    };

    const result = await runScript(app, [{ msg: mouse }, { key: 'x' }]);
    expect(sawMouseInPageUpdate).toBe(false);
    expect(result.model.pageModels.home?.count).toBe(1);
  });

  it('toggles help with ?', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }]);
    expect(result.model.helpOpen).toBe(true);
  });

  it('closes help with ? when help is open', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }, { key: '?' }]);
    expect(result.model.helpOpen).toBe(false);
  });

  it('closes help with escape', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }, { key: KEY_ESCAPE }]);
    expect(result.model.helpOpen).toBe(false);
  });

  it('treats help as modal and ignores non-close keys', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      globalKeys: createKeyMap<Msg>().bind('z', 'Increment', { type: 'inc' }),
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: '?' },
      { key: 'z' },
      { key: KEY_CTRL_P }, // ctrl+p should be ignored while help is open
    ]);

    expect(result.model.helpOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
    expect(result.model.pageModels.home?.count).toBe(0);
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

  it('dispatches selected custom commandItems actions', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update(msg, model) {
          if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
          return [model, []];
        },
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => 'main',
        }),
        commandItems: () => [{
          id: 'boost',
          label: 'Mega Boost',
          action: { type: 'inc' },
        }],
      }],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'm' },
      { key: 'e' },
      { key: 'g' },
      { key: 'a' },
      { key: KEY_ENTER },
    ]);

    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('closes command palette with q when query is empty', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'q' },
    ]);

    expect(result.model.commandPalette).toBeUndefined();
  });

  it('passes pane rects to overlayFactory for panel-scoped overlays', () => {
    let captured: FrameOverlayContext<PageModel> | undefined;

    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'split',
          splitId: 'shell',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'left', render: () => 'left' },
          paneB: { kind: 'pane', paneId: 'right', render: () => 'right' },
        }),
      }],
      overlayFactory(ctx) {
        captured = ctx;
        return [];
      },
    });

    const [model] = app.init();
    app.view(model);

    expect(captured).toBeDefined();
    expect(captured!.paneRects.has('left')).toBe(true);
    expect(captured!.paneRects.has('right')).toBe(true);
    // Body starts below 2-line chrome
    expect(captured!.paneRects.get('left')!.row).toBeGreaterThanOrEqual(2);
  });

  it('renders mode and focused pane in frame status line', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      title: 'Status Test',
    });

    const [model] = app.init();
    const ctx = createTestContext();
    const frame = app.view(model);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const lines = surfaceToString(frame, ctx.style).split('\n');
    expect(lines[1]).toContain('[NORMAL]');
    expect(lines[1]).toContain('page:home');
    expect(lines[1]).toContain('pane:main');
  });

  it('renders routed runtime issues through frame-managed notifications', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'error',
      source: 'command',
      message: 'Command rejected: worker crashed during boot',
      atMs: 0,
    });

    expect(runtimeMsg).toBeDefined();

    const [nextModel, cmds] = app.update(runtimeMsg as Msg, model);
    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 200,
    });

    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(tickMsg).toBeDefined();

    const [visibleModel] = app.update(tickMsg as Msg, nextModel);
    const frame = app.view(visibleModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const rendered = surfaceToString(frame, testCtx.style);
    expect(rendered).toContain('Command rejected: worker crashed during boot');
    expect(cmds).toHaveLength(1);
  });
});
