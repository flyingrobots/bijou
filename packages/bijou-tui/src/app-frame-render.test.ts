import { afterEach, describe, expect, it } from 'vitest';
import {
  createSurface,
  parseAnsiToSurface,
  setDefaultContext,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';
import { createTestContext, must, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import type { CreateFramedAppOptions, FrameLayoutNode, FramePage } from './app-frame.js';
import type { InternalFrameModel } from './app-frame-types.js';
import { createFrameKeyMap } from './app-frame-utils.js';
import {
  framePaneOutputToSurface,
  renderFrameNode,
  renderHelpLine,
  renderMaximizedPaneInto,
  renderPageContentInto,
  renderTransition,
  resolveHeaderLine,
} from './app-frame-render.js';
import { createPanelVisibilityState } from './panel-state.js';
import { createPanelDockState } from './panel-dock.js';
import { createNotificationState } from './notification.js';

afterEach(() => { _resetDefaultContextForTesting(); });

type EmptyModel = Record<string, never>;
type TestMsg = never;
type PaneRender = Extract<FrameLayoutNode, { readonly kind: 'pane' }>['render'];

function panePage<PageModel>(
  id: string,
  title: FramePage<PageModel, TestMsg>['title'],
  model: PageModel,
  render: PaneRender = () => createSurface(1, 1),
): FramePage<PageModel, TestMsg> {
  return {
    id,
    title,
    init: () => [model, []],
    update: (_msg, current) => [current, []],
    layout: () => ({ kind: 'pane', paneId: 'main', render }),
  };
}

function frameModel<PageModel>(
  overrides: Pick<InternalFrameModel<PageModel, TestMsg>, 'activePageId' | 'pageOrder' | 'pageModels'>
    & Partial<InternalFrameModel<PageModel, TestMsg>>,
): InternalFrameModel<PageModel, TestMsg> {
  return {
    warnedFrameKeyCollisionPages: {},
    focusedPaneByPage: {},
    scrollByPage: {},
    columns: 12,
    rows: 5,
    frameTimeMs: 0,
    viewTimeMs: 0,
    diffTimeMs: 0,
    frameOverBudget: false,
    perfHudOpen: false,
    helpOpen: false,
    helpScrollY: 0,
    settingsOpen: false,
    notificationCenterOpen: false,
    quitConfirmOpen: false,
    settingsFocusIndex: 0,
    settingsScrollY: 0,
    notificationCenterScrollY: 0,
    transitionProgress: 1,
    transitionGeneration: 0,
    transitionFrame: 0,
    minimizedByPage: {},
    maximizedPaneByPage: {},
    dockStateByPage: {},
    splitRatioOverrides: {},
    runtimeNotifications: createNotificationState(),
    runtimeNotificationHistoryFilter: 'ALL',
    runtimeNotificationLoopActive: false,
    ...overrides,
  };
}

function frameOptions<PageModel>(
  pages: readonly FramePage<PageModel, TestMsg>[],
  options: Omit<CreateFramedAppOptions<PageModel, TestMsg>, 'pages'> = {},
): CreateFramedAppOptions<PageModel, TestMsg> {
  return { pages, ...options };
}

function surfacePlainText(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

describe('renderTransition', () => {
  const ctx = createTestContext({ mode: 'interactive' });

  it('applies surface-native cell overrides directly', () => {
    const prev = createSurface(2, 1, { char: '.', fg: '#111111', bg: '#222222', modifiers: ['dim'], empty: false });
    const next = createSurface(2, 1, { char: 'n', fg: '#aaaaaa', bg: '#bbbbbb', empty: false });

    const result = renderTransition(
      prev,
      next,
      ({ x }) => (x === 0
        ? {
          showNext: false,
          overrideChar: 'X',
          overrideCell: { char: 'X', fg: '#ff0000', bg: '#000000', modifiers: ['bold'], empty: false },
        }
        : { showNext: true }),
      0.5,
      2,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: 'X',
      fg: '#ff0000',
      bg: '#000000',
      modifiers: ['bold'],
      empty: false,
    });
    expect(result.get(1, 0)).toMatchObject({
      char: 'n',
      fg: '#aaaaaa',
      bg: '#bbbbbb',
      empty: false,
    });
  });

  it('keeps the selected base cell styling for plain character overrides', () => {
    const prev = createSurface(1, 1, { char: 'p', fg: '#123456', bg: '#654321', modifiers: ['underline'], empty: false });
    const next = createSurface(1, 1, { char: 'n', fg: '#abcdef', bg: '#fedcba', empty: false });

    const result = renderTransition(
      prev,
      next,
      () => ({ showNext: false, overrideChar: '░' }),
      0.5,
      1,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: '░',
      fg: '#123456',
      bg: '#654321',
      modifiers: ['underline'],
      empty: false,
    });
  });
});

describe('frame shell chrome surfaces', () => {
  it('fills the full header and help lines with BCSS background styles', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }): Record<string, string> {
        if (identity.id === 'frame-header') return { color: '#ffffff', background: '#112233' };
        if (identity.id === 'frame-help') return { color: '#eeeeee', background: '#223344' };
        return {};
      },
    };
    setDefaultContext(ctx);

    const activePage = panePage<EmptyModel>('home', 'Home', {});
    const pagesById = new Map([['home', activePage]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 12,
      rows: 5,
    });
    const options = frameOptions([activePage], { title: 'Test' });

    const header = resolveHeaderLine(model, options, pagesById).surface;
    const help = renderHelpLine(model, {
      id: 'workspace',
      kind: 'workspace',
      owner: 'frame',
      inputMapId: 'frame-workspace',
      dismissible: false,
      blocksUnderlyingInput: false,
      hintSource: createFrameKeyMap(),
    }, undefined);

    for (let x = 0; x < 12; x++) {
      expect(header.get(x, 0).bg).toBe('#112233');
      expect(help.get(x, 0).bg).toBe('#223344');
      expect(header.get(x, 0).empty).toBe(false);
      expect(help.get(x, 0).empty).toBe(false);
    }
  });

  it('paints unstyled pane text with the frame surface foreground', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const expectedSurface = ctx.surface('primary');
    const expectedFg = expectedSurface.hex;
    const expectedBg = expectedSurface.bg;
    expect(expectedBg).toBeDefined();

    const page = panePage<EmptyModel>('home', 'Home', {}, (width, height) => {
      const surface = createSurface(width, height);
      surface.set(0, 0, { char: 'A', empty: false });
      return surface;
    });
    const pagesById = new Map([['home', page]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 8,
      rows: 4,
    });
    const target = createSurface(8, 4);

    renderPageContentInto(
      'home',
      model,
      { row: 0, col: 0, width: 8, height: 4 },
      pagesById,
      target,
      0,
      0,
      undefined,
      ctx,
    );

    const textCell = target.get(1, 0);
    expect(textCell.char).toBe('A');
    expect(textCell.fg).toBe(expectedFg);
    expect(textCell.bg).toBe(expectedBg);
  });

  it('falls back to the frame background when chrome rows have no explicit BCSS background', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const expectedBg = ctx.surface('primary').bg ?? ctx.surface('secondary').bg;
    expect(expectedBg).toBeDefined();

    const activePage = panePage<EmptyModel>('home', 'Home', {});
    const pagesById = new Map([['home', activePage]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 12,
      rows: 5,
    });
    const options = frameOptions([activePage], { title: 'Test' });

    const header = resolveHeaderLine(model, options, pagesById).surface;
    const help = renderHelpLine(model, {
      id: 'workspace',
      kind: 'workspace',
      owner: 'frame',
      inputMapId: 'frame-workspace',
      dismissible: false,
      blocksUnderlyingInput: false,
      hintSource: createFrameKeyMap(),
    }, undefined);
    for (let x = 0; x < 12; x++) {
      expect(header.get(x, 0).bg).toBe(expectedBg);
      expect(help.get(x, 0).bg).toBe(expectedBg);
      expect(header.get(x, 0).empty).toBe(false);
      expect(help.get(x, 0).empty).toBe(false);
    }
  });
  it('derives a stronger active-tab foreground than the base header color', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }): Record<string, string> {
        if (identity.id === 'frame-header') return { color: '#d8dee9', background: '#2e3440' };
        return {};
      },
    };
    setDefaultContext(ctx);
    const homePage = panePage<EmptyModel>('home', 'Home', {});
    const logsPage = panePage<EmptyModel>('logs', 'Logs', {});
    const pagesById = new Map([
      ['home', homePage],
      ['logs', logsPage],
    ]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home', 'logs'],
      pageModels: { home: {}, logs: {} },
      focusedPaneByPage: { home: 'main', logs: 'main' },
      scrollByPage: {},
      columns: 24,
      rows: 5,
    });
    const header = resolveHeaderLine(model, frameOptions([homePage, logsPage], { title: 'DOGFOOD' }), pagesById);
    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    const inactiveTarget = header.tabTargets.find((target) => target.pageId === 'logs');
    expect(activeTarget).toBeDefined();
    expect(inactiveTarget).toBeDefined();
    const activeCell = header.surface.get(must(activeTarget).startCol + 1, 0);
    const inactiveCell = header.surface.get(must(inactiveTarget).startCol + 1, 0);
    expect(activeCell.bg).toBe('#2e3440');
    expect(inactiveCell.bg).toBe('#2e3440');
    expect(activeCell.fg).not.toBe('#d8dee9');
    expect(activeCell.fg).not.toBe(inactiveCell.fg);
    expect(activeCell.modifiers).toContain('bold');
  });
  it('resolves page tab text from the current page model at render time', () => {
    interface CountModel { readonly count: number }
    const activePage = panePage<CountModel>('home', (model) => `Home ${String(model.count)}`, { count: 0 });
    const pagesById = new Map([['home', activePage]]);
    const model = frameModel<CountModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: { count: 2 } },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 24,
      rows: 5,
    });
    const options = frameOptions([activePage], { title: 'DOGFOOD' });
    const firstHeader = resolveHeaderLine(model, options, pagesById);
    const nextHeader = resolveHeaderLine({
      ...model,
      pageModels: { home: { count: 7 } },
    }, options, pagesById);
    expect(surfacePlainText(firstHeader.surface)).toContain('Home 2');
    expect(surfacePlainText(nextHeader.surface)).toContain('Home 7');
    expect(surfacePlainText(nextHeader.surface)).not.toContain('Home 2');
  });
  it('honors an explicit active-tab token override from frame options', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }): Record<string, string> {
        if (identity.id === 'frame-header') return { color: '#d8dee9', background: '#2e3440' };
        return {};
      },
    };
    setDefaultContext(ctx);
    interface ToneModel { readonly tone: string }
    const homePage = panePage<ToneModel>('home', 'Home', { tone: '#ffaa33' });
    const pagesById = new Map([['home', homePage]]);
    const model = frameModel<ToneModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: { tone: '#ffaa33' } },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 20,
      rows: 5,
    });
    const header = resolveHeaderLine(model, frameOptions([homePage], {
      title: 'DOGFOOD',
      headerStyle: () => ({ activeTabToken: { hex: '#ffaa33', bg: '#332211', modifiers: ['bold'] } }),
    }), pagesById);
    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    expect(activeTarget).toBeDefined();
    const activeCell = header.surface.get(must(activeTarget).startCol + 1, 0);
    expect(activeCell.fg).toBe('#ffaa33');
    expect(activeCell.bg).toBe('#332211');
    expect(activeCell.modifiers).toContain('bold');
  });
  it('preserves existing header modifiers when the active-tab override only changes color', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }): Record<string, string> {
        if (identity.id === 'frame-header') {
          return {
            color: '#d8dee9',
            background: '#2e3440',
            'text-decoration': 'underline',
          };
        }
        return {};
      },
    };
    setDefaultContext(ctx);
    const homePage = panePage<EmptyModel>('home', 'Home', {});
    const pagesById = new Map([['home', homePage]]);
    const model = frameModel<EmptyModel>({
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 20,
      rows: 5,
    });
    const header = resolveHeaderLine(model, frameOptions([homePage], {
      title: 'DOGFOOD',
      headerStyle: () => ({ activeTabToken: { hex: '#ffaa33', bg: '#332211' } }),
    }), pagesById);
    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    expect(activeTarget).toBeDefined();
    const activeCell = header.surface.get(must(activeTarget).startCol + 1, 0);
    expect(activeCell.fg).toBe('#ffaa33');
    expect(activeCell.bg).toBe('#332211');
    expect(activeCell.modifiers).toContain('underline');
  });
});
describe('frame pane output normalization', () => {
  it('re-roots non-zero-origin layout nodes before pane rendering', () => {
    const nodeSurface = createSurface(3, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    nodeSurface.set(2, 0, { char: 'C', empty: false });
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface: nodeSurface,
    };
    const rendered = framePaneOutputToSurface(layout, 3, 1);
    expect(Array.from({ length: rendered.width }, (_, x) => rendered.get(x, 0).char).join('')).toBe('ABC');
  });
  it('can normalize pane output into a reusable scratch surface', () => {
    const nodeSurface = createSurface(3, 1, { char: ' ', empty: false });
    nodeSurface.set(0, 0, { char: 'A', empty: false });
    nodeSurface.set(1, 0, { char: 'B', empty: false });
    nodeSurface.set(2, 0, { char: 'C', empty: false });
    const layout: LayoutNode = {
      rect: { x: 2, y: 1, width: 3, height: 1 },
      children: [],
      surface: nodeSurface,
    };
    const scratch = createSurface(3, 1);
    scratch.fill({ char: 'x', empty: false });
    const rendered = framePaneOutputToSurface(layout, 3, 1, scratch);
    expect(rendered).toBe(scratch);
    expect(Array.from({ length: rendered.width }, (_, x) => rendered.get(x, 0).char).join('')).toBe('ABC');
  });
});
describe('frame layout composition', () => {
  it('renders nested grid and split layouts into a single composed surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const labelSurface = (text: string, width: number, height: number) => parseAnsiToSurface(text, width, height);
    const result = renderFrameNode(
      {
        kind: 'grid',
        gridId: 'shell',
        columns: [8, '1fr', 8],
        rows: ['1fr'],
        areas: ['nav main side'],
        gap: 1,
        cells: {
          nav: {
            kind: 'pane',
            paneId: 'nav',
            render: (width, height) => labelSurface('nav', width, height),
          },
          main: {
            kind: 'split',
            splitId: 'stack',
            direction: 'column',
            state: { ratio: 0.6, focused: 'a' },
            paneA: {
              kind: 'pane',
              paneId: 'docs',
              render: (width, height) => labelSurface('docs', width, height),
            },
            paneB: {
              kind: 'pane',
              paneId: 'demo',
              render: (width, height) => labelSurface('demo', width, height),
            },
          },
          side: {
            kind: 'pane',
            paneId: 'side',
            render: (width, height) => labelSurface('side', width, height),
          },
        },
      },
      { row: 2, col: 4, width: 36, height: 12 },
      {
        model: frameModel<EmptyModel>({
          activePageId: 'bench',
          pageOrder: ['bench'],
          pageModels: { bench: {} },
          splitRatioOverrides: {},
        }),
        pageId: 'bench',
        focusedPaneId: 'docs',
        scrollByPane: {},
        visibility: createPanelVisibilityState(),
        dockState: createPanelDockState(),
        frameBackgroundToken: undefined,
      },
    );
    expect(result.surface.width).toBe(36);
    expect(result.surface.height).toBe(12);
    expect(result.paneRects.get('nav')).toEqual({ row: 2, col: 4, width: 8, height: 12 });
    expect(result.paneRects.get('docs')?.height).toBeGreaterThan(result.paneRects.get('demo')?.height ?? 0);
    expect(result.paneOrder).toEqual(['nav', 'docs', 'demo', 'side']);
    const renderedText = Array.from({ length: result.surface.height }, (_, y) =>
      Array.from({ length: result.surface.width }, (_, x) => result.surface.get(x, y).char).join(''),
    ).join('\n');
    expect(renderedText).toContain('nav');
    expect(renderedText).toContain('docs');
    expect(renderedText).toContain('demo');
    expect(renderedText).toContain('side');
  });
});
describe('frame direct-paint helpers', () => {
  it('can paint page content directly into an existing frame surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const target = createSurface(20, 8);
    const page: FramePage<EmptyModel, TestMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 'shell',
        state: { ratio: 0.5, focused: 'a' },
        paneA: { kind: 'pane', paneId: 'left', render: () => parseAnsiToSurface('left', 4, 1) },
        paneB: { kind: 'pane', paneId: 'right', render: () => parseAnsiToSurface('right', 5, 1) },
      }),
    };
    const geometry = renderPageContentInto(
      'home',
      frameModel<EmptyModel>({
        activePageId: 'home',
        pageOrder: ['home'],
        pageModels: { home: {} },
        focusedPaneByPage: { home: 'left' },
      }),
      { row: 2, col: 3, width: 14, height: 4 },
      new Map([[page.id, page]]),
      target,
    );
    const renderedText = Array.from({ length: target.height }, (_, y) =>
      Array.from({ length: target.width }, (_, x) => target.get(x, y).char).join(''),
    ).join('\n');
    expect(renderedText).toContain('left');
    expect(renderedText).toContain('right');
    expect(geometry.paneRects.get('left')).toEqual({ row: 2, col: 3, width: 7, height: 4 });
    expect(geometry.paneRects.get('right')).toEqual({ row: 2, col: 11, width: 6, height: 4 });
  });
  it('can paint a maximized pane directly into an existing frame surface', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const target = createSurface(20, 8);
    const page: FramePage<EmptyModel, TestMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []],
      update: (_msg, model) => [model, []],
      layout: () => ({
        kind: 'split',
        splitId: 'shell',
        state: { ratio: 0.5, focused: 'a' },
        paneA: { kind: 'pane', paneId: 'left', render: () => parseAnsiToSurface('left', 4, 1) },
        paneB: { kind: 'pane', paneId: 'right', render: () => parseAnsiToSurface('right', 5, 1) },
      }),
    };
    const geometry = renderMaximizedPaneInto(
      'home',
      frameModel<EmptyModel>({
        activePageId: 'home',
        pageOrder: ['home'],
        pageModels: { home: {} },
        focusedPaneByPage: { home: 'left' },
      }),
      { row: 1, col: 2, width: 12, height: 3 },
      new Map([[page.id, page]]),
      'right',
      target,
    );
    const renderedText = Array.from({ length: target.height }, (_, y) =>
      Array.from({ length: target.width }, (_, x) => target.get(x, y).char).join(''),
    ).join('\n');
    expect(renderedText).toContain('right');
    expect(geometry.paneRects.get('right')).toEqual({ row: 1, col: 2, width: 12, height: 3 });
    expect(geometry.paneOrder).toEqual(['right']);
  });
});
