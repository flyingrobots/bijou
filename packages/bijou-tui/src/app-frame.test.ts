import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, mockClock, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { setDefaultContext, stringToSurface, surfaceToString } from '@flyingrobots/bijou';
import { createKeyMap } from './keybindings.js';
import { createSplitPaneState } from './split-pane.js';
import { runScript } from './driver.js';
import { normalizeViewOutput } from './view-output.js';
import {
  createNotificationState,
  dismissNotification,
  hitTestNotificationStack,
  pushNotification,
  tickNotifications,
  type NotificationHistoryFilter,
  type NotificationState,
} from './notification.js';
import { createFramedApp, type FramePage, type FrameOverlayContext, type PageTransition } from './app-frame.js';
import { QUIT, type Cmd, type MouseMsg } from './types.js';
import { tick } from './commands.js';

type Msg =
  | { type: 'inc' }
  | { type: 'noop' }
  | { type: 'toggle-hints' };

interface PageModel {
  count: number;
  showHints?: boolean;
}

const KEY_TAB = '\t';
const KEY_SHIFT_TAB = '\x1b[Z';
const KEY_ESCAPE = '\x1b';
const KEY_CTRL_P = '\x10';
const KEY_ENTER = '\r';
const KEY_DOWN = '\x1b[B';

function ctrlKey(key: string) {
  return { type: 'key' as const, key, ctrl: true, alt: false, shift: false };
}

function shiftKey(key: string) {
  return { type: 'key' as const, key, ctrl: false, alt: false, shift: true };
}

function makeLongContent(label: string, lines = 40): string {
  return Array.from({ length: lines }, (_, i) => `${label} line ${i}`).join('\n');
}

function textView(text: string) {
  const lines = text.split('\n');
  const width = Math.max(1, ...lines.map((line) => line.length));
  return stringToSurface(text, width, Math.max(1, lines.length));
}

function seedNotificationHistory<Msg>(
  specs: ReadonlyArray<{
    readonly title: string;
    readonly message?: string;
    readonly tone?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    readonly variant?: 'TOAST' | 'INLINE' | 'ACTIONABLE';
  }>,
): NotificationState<Msg> {
  let state = createNotificationState<Msg>();
  let nowMs = 0;

  for (const spec of specs) {
    state = pushNotification(state, {
      title: spec.title,
      message: spec.message ?? `${spec.title} message`,
      tone: spec.tone ?? 'INFO',
      variant: spec.variant ?? 'TOAST',
      durationMs: null,
    }, nowMs);
    const id = state.items.at(-1)!.id;
    nowMs += 20;
    state = dismissNotification(state, id, nowMs);
    nowMs += 500;
    state = tickNotifications(state, nowMs);
  }

  return state;
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
      render: () => textView(makeLongContent(`${id}:${paneId}`)),
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
          paneA: { kind: 'pane', paneId: 'main', render: () => textView('left') },
          paneB: { kind: 'pane', paneId: 'main', render: () => textView('right') },
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
            main: { kind: 'pane', paneId: 'main', render: () => textView('main') },
            ghost: { kind: 'pane', paneId: 'ghost', render: () => textView('ghost') },
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
        render: () => textView(makeLongContent('home:main')),
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
        render: () => textView('home'),
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
        render: () => textView(`${id} pane`),
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
        render: () => textView('home'),
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
        render: () => textView('logs'),
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

  it('forwards unhandled mouse messages to the active page', async () => {
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
        render: () => textView('main'),
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

    const result = await runScript(app, [{ mouse }, { key: 'x' }]);
    expect(sawMouseInPageUpdate).toBe(true);
    expect(result.model.pageModels.home?.count).toBe(1);
  });

  it('switches tabs when the user clicks a header tab', async () => {
    const app = createFramedApp({
      title: 'Test',
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });

    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'left',
        action: 'press',
        col: 15,
        row: 0,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);

    expect(result.model.activePageId).toBe('logs');
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

  it('opens quit confirm with escape while help is open', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: '?' }, { key: KEY_ESCAPE }]);
    expect(result.model.helpOpen).toBe(false);
    expect((result.model as any).quitConfirmOpen).toBe(true);
  });

  it('lets help scroll with frame scroll keys when the overlay is taller than the viewport', () => {
    const tallHelpPage: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      keyMap: createKeyMap<Msg>()
        .group('Extra', (group) => {
          let next = group;
          for (let index = 0; index < 32; index++) {
            next = next.bind(`${index % 10}`, `Binding ${index}`, { type: 'noop' });
          }
          return next;
        }),
    };

    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 16,
      pages: [tallHelpPage],
    });

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);

    expect((model as any).helpOpen).toBe(true);
    expect((model as any).helpScrollY).toBeGreaterThan(0);
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

  it('blocks page mouse updates while help or the command palette is open', async () => {
    type MsgWithMouse = Msg | MouseMsg;

    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      commandItems: () => [{
        id: 'noop',
        label: 'No-op',
        action: { type: 'inc' },
      }],
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({
      pages: [page],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      {
        key: '?',
      },
      {
        mouse: {
          type: 'mouse',
          button: 'none',
          action: 'scroll-down',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
      {
        key: '?',
      },
      {
        key: KEY_CTRL_P,
      },
      {
        mouse: {
          type: 'mouse',
          button: 'right',
          action: 'press',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
    ]);

    expect(result.model.helpOpen).toBe(false);
    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.pageModels.home?.count).toBe(0);
  });

  it('opens settings with F2 and lets / and ctrl+p switch between search and the command palette', () => {
    const app = createFramedApp({
      pages: [{
        ...makePage('home', 'Home', 'main'),
        searchTitle: 'Search home',
        searchItems: () => [{
          id: 'home-search',
          label: 'Home result',
        }],
      }],
      enableCommandPalette: true,
      settings: () => ({
        title: 'Settings',
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
    expect((model as any).settingsOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).settingsOpen).toBe(false);

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Search home');

    [model] = app.update(ctrlKey('p'), model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Command Palette');

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeDefined();
    expect((model as any).commandPaletteTitle).toBe('Search home');

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeUndefined();
  });

  it('opens a quit-confirm modal from the shell and quits on confirmation', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    let cmds: Cmd<Msg>[] = [];
    [model, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).quitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update({ type: 'key', key: 'y', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).quitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await cmds[0]!(() => {}, {
      onPulse() {
        return { dispose() {} };
      },
    });
    expect(returned).toBe(QUIT);
  });

  it('opens quit confirm with escape while settings are open', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
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
    expect((model as any).settingsOpen).toBe(true);

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).settingsOpen).toBe(false);
    expect((model as any).quitConfirmOpen).toBe(true);
  });

  it('opens quit confirm with escape while the command palette is open', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey('p'), model);
    expect((model as any).commandPalette).toBeDefined();

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect((model as any).commandPalette).toBeUndefined();
    expect((model as any).quitConfirmOpen).toBe(true);
  });

  it('quits immediately in pipe mode instead of opening quit confirm', async () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    setDefaultContext(pipeCtx);
    try {
      const app = createFramedApp({
        pages: [makePage('home', 'Home', 'main')],
      });

      let [model] = app.init();
      const [nextModel, cmds] = app.update({ type: 'key', key: 'q', ctrl: false, alt: false, shift: false }, model);
      expect((nextModel as any).quitConfirmOpen).toBe(false);
      expect(cmds).toHaveLength(1);

      const returned = await cmds[0]!(() => {}, {
        onPulse() {
          return { dispose() {} };
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
          render: () => textView('main'),
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

  it('opens settings with the standard shell binding and blocks page keys while open', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    expect((model as any).settingsOpen).toBe(true);

    const [nextModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    expect(nextModel.pageModels.home?.count).toBe(0);
    expect((nextModel as any).settingsOpen).toBe(true);
    expect(cmds).toHaveLength(0);
  });

  it('shows a shell-owned toast when a settings row is activated', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: 'Settings',
              message: 'Show hints turned off.',
            },
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const [nextModel, cmds] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

    expect(cmds).toHaveLength(2);
    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(nextModel.runtimeNotifications.items[0]?.title).toBe('Settings');
    expect(nextModel.runtimeNotifications.items[0]?.message).toBe('Show hints turned off.');

    const rendered = surfaceToString(normalizeViewOutput(app.view(nextModel), {
      width: testCtx.runtime.columns,
      height: testCtx.runtime.rows,
    }).surface, testCtx.style);
    expect(rendered).toContain('notices:1');
  });

  it('scrolls a long settings drawer independently of the underlying page', () => {
    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 14,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: Array.from({ length: 24 }, (_, index) => ({
            id: `setting-${index}`,
            label: `Setting ${index}`,
            valueLabel: index % 2 === 0 ? 'On' : 'Off',
          })),
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);

    expect((model as any).settingsScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);
  });

  it('renders settings row descriptions as secondary drawer copy', () => {
    const app = createFramedApp({
      initialColumns: 90,
      initialRows: 18,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            description: 'Show active control cues in the footer.',
            valueLabel: 'On',
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const rendered = surfaceToString(normalizeViewOutput(app.view(model), {
      width: 90,
      height: 18,
    }).surface, testCtx.style);

    expect(rendered).toContain('Show hints');
    expect(rendered).toContain('Show active control');
    expect(rendered).toContain('cues in the footer');
  });

  it('opens settings from the standard command palette entry', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
      settings: () => ({
        title: 'Settings',
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

    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 's' },
      { key: 'e' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);

    expect((result.model as any).settingsOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('opens the shell notification center with Shift+N and closes it with the same binding', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    expect((model as any).notificationCenterOpen).toBe(true);

    [model] = app.update(shiftKey('n'), model);
    expect((model as any).notificationCenterOpen).toBe(false);
  });

  it('scrolls a shell notification center independently of the underlying page', () => {
    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<Msg>;
    }

    const notifications = seedNotificationHistory<Msg>(
      Array.from({ length: 18 }, (_, index) => ({
        title: `Notice ${index}`,
        tone: index % 2 === 0 ? 'WARNING' : 'INFO',
      })),
    );

    const page: FramePage<NotificationPageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications,
      }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('home:main')),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp<NotificationPageModel, Msg>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as Msg, model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false } as unknown as Msg, model);

    expect((model as any).notificationCenterOpen).toBe(true);
    expect((model as any).notificationCenterScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);

    const [nextModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false } as unknown as Msg, model);
    expect(nextModel.pageModels.home?.count).toBe(0);
    expect((nextModel as any).notificationCenterOpen).toBe(true);
    expect(cmds).toHaveLength(0);
  });

  it('cycles notification-center filters through app-provided filter state', async () => {
    const filters: readonly NotificationHistoryFilter[] = ['ALL', 'ERROR', 'WARNING'];

    type NotificationMsg =
      | { type: 'inc' }
      | { type: 'set-history-filter'; filter: NotificationHistoryFilter };

    interface NotificationPageModel {
      readonly count: number;
      readonly notifications: NotificationState<NotificationMsg>;
      readonly filterIndex: number;
    }

    const page: FramePage<NotificationPageModel, NotificationMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<NotificationMsg>([
          { title: 'Deploy blocked', tone: 'ERROR' },
          { title: 'Queue pressure', tone: 'WARNING' },
        ]),
        filterIndex: 0,
      }, []],
      update(msg, model) {
        if (msg.type === 'set-history-filter') {
          return [{
            ...model,
            filterIndex: Math.max(0, filters.indexOf(msg.filter)),
          }, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<NotificationPageModel, NotificationMsg>({
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
        filters,
        activeFilter: filters[pageModel.filterIndex]!,
        onFilterChange: (filter) => ({ type: 'set-history-filter', filter }),
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as NotificationMsg, model);
    let cmds: Cmd<NotificationMsg>[] = [];
    [model, cmds] = app.update({ type: 'key', key: 'f', ctrl: false, alt: false, shift: false } as unknown as NotificationMsg, model);

    expect(cmds).toHaveLength(1);
    const returned = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
    });
    [model] = app.update(returned as NotificationMsg, model);

    expect(model.pageModels.home?.filterIndex).toBe(1);
    expect((model as any).notificationCenterScrollY).toBe(0);
  });

  it('opens the shell notification center from the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 'n' },
      { key: 'o' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);

    expect((result.model as any).notificationCenterOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });

  it('surfaces a footer notification cue when archived shell notifications exist', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'warning',
      source: 'runtime',
      message: 'Framework warning',
      atMs: 0,
    });
    if (runtimeMsg == null) throw new Error('expected runtime issue message');

    const [nextModel, cmds] = app.update(runtimeMsg as Msg, model);
    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 8_000,
    });
    const [archivedModel] = app.update(tickMsg as Msg, nextModel);
    const frame = app.view(archivedModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const footer = surfaceToString(frame, testCtx.style).split('\n').at(-1)!;

    expect(footer).toContain('notices:1');
  });

  it('keeps notification-center mouse interactions from leaking through to the underlying page', () => {
    type MsgWithMouse = Msg | MouseMsg;

    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<MsgWithMouse>;
    }

    const page: FramePage<NotificationPageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<MsgWithMouse>(
          Array.from({ length: 20 }, (_, index) => ({
            title: `Notice ${index}`,
            tone: index % 2 === 0 ? 'SUCCESS' : 'WARNING',
          })),
        ),
      }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<NotificationPageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n') as unknown as MsgWithMouse, model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 76,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel as unknown as MsgWithMouse, model);

    const click: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 76,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click as unknown as MsgWithMouse, model);

    expect((model as any).notificationCenterScrollY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });

  it('keeps drawer mouse interactions from leaking through to the underlying page', async () => {
    type MsgWithMouse = Msg | MouseMsg;

    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: Array.from({ length: 24 }, (_, index) => ({
            id: `setting-${index}`,
            label: `Setting ${index}`,
            valueLabel: index % 2 === 0 ? 'On' : 'Off',
          })),
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(',') as unknown as MsgWithMouse, model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 4,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel as unknown as MsgWithMouse, model);

    const click: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 4,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click as unknown as MsgWithMouse, model);

    expect((model as any).settingsScrollY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });

  it('lets q remain text input inside the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'q' },
    ]);

    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.quitConfirmOpen).toBe(false);
    expect(result.model.commandPalette?.query).toBe('q');
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
          paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
          paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
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
    // Body starts below the single-line header and above the footer
    expect(captured!.paneRects.get('left')!.row).toBeGreaterThanOrEqual(1);
  });

  it('renders mode and focused pane in the frame footer line', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      title: 'Status Test',
    });

    const [model] = app.init();
    const ctx = createTestContext();
    const frame = app.view(model);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const lines = surfaceToString(frame, ctx.style).split('\n');
    expect(lines[frame.height - 1]).toContain('[NORMAL]');
    expect(lines[frame.height - 1]).toContain('page:home');
    expect(lines[frame.height - 1]).toContain('pane:main');
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

  it('treats frame-managed runtime notifications as dismiss-only mouse targets', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'warning',
      source: 'runtime',
      message: 'Framework warning',
      atMs: 0,
    });
    if (runtimeMsg == null) throw new Error('expected runtime issue message');

    const [nextModel, cmds] = app.update(runtimeMsg as Msg, model);
    const tickMsg = await cmds[0]!(() => undefined, {
      onPulse: () => ({ dispose() {} }),
      sleep: async () => undefined,
      now: () => 200,
    });
    const [visibleModel] = app.update(tickMsg as Msg, nextModel);

    let dismissMouse: MouseMsg | undefined;
    let sawActionTarget = false;
    for (let row = 0; row < visibleModel.rows; row++) {
      for (let col = 0; col < visibleModel.columns; col++) {
        const target = hitTestNotificationStack(visibleModel.runtimeNotifications, {
          screenWidth: visibleModel.columns,
          screenHeight: visibleModel.rows,
          margin: 1,
          gap: 1,
          ctx: testCtx,
        }, col, row);
        if (target?.kind === 'action') sawActionTarget = true;
        if (target?.kind === 'dismiss' && dismissMouse == null) {
          dismissMouse = {
            type: 'mouse',
            action: 'press',
            button: 'left',
            col,
            row,
            shift: false,
            alt: false,
            ctrl: false,
          };
        }
      }
    }

    expect(sawActionTarget).toBe(false);
    expect(dismissMouse).toBeDefined();

    const [dismissedModel] = app.update(dismissMouse!, visibleModel);
    expect(dismissedModel.runtimeNotifications.items).toHaveLength(1);
    expect(dismissedModel.runtimeNotifications.items[0]?.phase).toBe('exiting');
    expect(dismissedModel.runtimeNotificationLoopActive).toBe(true);
  }, 10000);

  it('treats modal keymaps as exclusive while a page modal is open', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0, modalOpen: true }, []],
        update(msg, model) {
          if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
          if (msg.type === 'noop') return [model, []];
          return [model, []];
        },
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => textView('modal page'),
        }),
        keyMap: createKeyMap<Msg>()
          .bind('x', 'Increment', { type: 'inc' }),
        modalKeyMap(model) {
          if (!model.modalOpen) return undefined;
          return createKeyMap<Msg>()
            .bind('escape', 'Close modal', { type: 'noop' });
        },
      }],
    });

    const result = await runScript(app, [
      { key: 'x' },
      { key: ']' },
      { key: KEY_ESCAPE },
    ]);

    expect(result.model.activePageId).toBe('home');
    expect(result.model.pageModels.home?.count).toBe(0);
  });

  it('keeps pane keymaps inactive while a page modal is open', async () => {
    type PaneMsg = { type: 'pane-hit' } | { type: 'close-modal' };

    const page: FramePage<{ paneHits: number; modalOpen: boolean }, PaneMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ paneHits: 0, modalOpen: true }, []],
      update(msg, model) {
        if (msg.type === 'pane-hit') return [{ ...model, paneHits: model.paneHits + 1 }, []];
        if (msg.type === 'close-modal') return [{ ...model, modalOpen: false }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 's1',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
      }),
      modalKeyMap(model) {
        if (!model.modalOpen) return undefined;
        return createKeyMap<PaneMsg>().bind('escape', 'Close modal', { type: 'close-modal' });
      },
      inputAreas: () => [{
        paneId: 'left',
        keyMap: createKeyMap<PaneMsg>().bind('down', 'Pane hit', { type: 'pane-hit' }),
      }],
    };

    const app = createFramedApp({ pages: [page] });
    const result = await runScript(app, [
      { key: KEY_DOWN },
      { key: KEY_ESCAPE },
      { key: KEY_DOWN },
    ]);

    expect(result.model.pageModels.home?.modalOpen).toBe(false);
    expect(result.model.pageModels.home?.paneHits).toBe(1);
  });
});
