import { describe, it, expect } from 'vitest';
import { createKeyMap } from './keybindings.js';
import { createSplitPaneState } from './split-pane.js';
import { runScript } from './driver.js';
import { createFramedApp, type FramePage, type FrameOverlayContext } from './app-frame.js';
import type { MouseMsg } from './types.js';

type Msg =
  | { type: 'inc' }
  | { type: 'noop' };

interface PageModel {
  count: number;
}

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
    const result = await runScript(app, [{ key: '\t' }, { key: '\x1b[Z' }]);
    expect(result.model.focusedPaneByPage.home).toBe('left');
  });

  it('dispatches page keymap actions into page update', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const result = await runScript(app, [{ key: 'x' }]);
    expect(result.model.pageModels.home?.count).toBe(1);
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

    const result = await runScript(app, [{ key: '?' }, { key: '\x1b' }]);
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
      { key: '\x10' }, // ctrl+p should be ignored while help is open
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
      { key: '\x10' },
      { key: 'z' },
      { key: '\r' },
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
      { key: '\x10' }, // ctrl+p
      { key: 'm' },
      { key: 'e' },
      { key: 'g' },
      { key: 'a' },
      { key: '\r' },
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
      { key: '\x10' }, // ctrl+p
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
    const lines = app.view(model).split('\n');
    expect(lines[1]).toContain('[NORMAL]');
    expect(lines[1]).toContain('page:home');
    expect(lines[1]).toContain('pane:main');
  });
});
