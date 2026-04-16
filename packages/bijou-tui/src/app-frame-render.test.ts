import { afterEach, describe, expect, it } from 'vitest';
import { createSurface, parseAnsiToSurface, setDefaultContext, type LayoutNode } from '@flyingrobots/bijou';
import { createTestContext, _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
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

afterEach(() => _resetDefaultContextForTesting());

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
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }) {
        if (identity.id === 'frame-header') return { color: '#ffffff', background: '#112233' };
        if (identity.id === 'frame-help') return { color: '#eeeeee', background: '#223344' };
        return {} as Record<string, string>;
      },
    };
    setDefaultContext(ctx);

    const activePage = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({ kind: 'pane' as const, paneId: 'main', render: () => createSurface(1, 1) }),
    };
    const pagesById = new Map([['home', activePage]]);
    const model = {
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 12,
      rows: 5,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: {} as never,
      runtimeNotificationLoopActive: false,
      warnedFrameKeyCollisionPages: {},
    };
    const options = { title: 'Test', pages: [activePage] };

    const header = resolveHeaderLine(model as any, options as any, pagesById as any).surface;
    const help = renderHelpLine(model as any, {
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

  it('falls back to the frame background when chrome rows have no explicit BCSS background', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    setDefaultContext(ctx);
    const expectedBg = ctx.surface('primary').bg ?? ctx.surface('secondary').bg;
    expect(expectedBg).toBeDefined();

    const activePage = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({ kind: 'pane' as const, paneId: 'main', render: () => createSurface(1, 1) }),
    };
    const pagesById = new Map([['home', activePage]]);
    const model = {
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 12,
      rows: 5,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: {} as never,
      runtimeNotificationLoopActive: false,
      warnedFrameKeyCollisionPages: {},
    };
    const options = { title: 'Test', pages: [activePage] };

    const header = resolveHeaderLine(model as any, options as any, pagesById as any).surface;
    const help = renderHelpLine(model as any, {
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
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }) {
        if (identity.id === 'frame-header') return { color: '#d8dee9', background: '#2e3440' };
        return {} as Record<string, string>;
      },
    };
    setDefaultContext(ctx);

    const homePage = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({ kind: 'pane' as const, paneId: 'main', render: () => createSurface(1, 1) }),
    };
    const logsPage = {
      ...homePage,
      id: 'logs',
      title: 'Logs',
    };
    const pagesById = new Map([
      ['home', homePage],
      ['logs', logsPage],
    ]);
    const model = {
      activePageId: 'home',
      pageOrder: ['home', 'logs'],
      pageModels: { home: {}, logs: {} },
      focusedPaneByPage: { home: 'main', logs: 'main' },
      scrollByPage: {},
      columns: 24,
      rows: 5,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: {} as never,
      runtimeNotificationLoopActive: false,
      warnedFrameKeyCollisionPages: {},
    };

    const header = resolveHeaderLine(model as any, { title: 'DOGFOOD', pages: [homePage, logsPage] } as any, pagesById as any);
    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    const inactiveTarget = header.tabTargets.find((target) => target.pageId === 'logs');
    expect(activeTarget).toBeDefined();
    expect(inactiveTarget).toBeDefined();

    const activeCell = header.surface.get(activeTarget!.startCol + 1, 0);
    const inactiveCell = header.surface.get(inactiveTarget!.startCol + 1, 0);
    expect(activeCell.bg).toBe('#2e3440');
    expect(inactiveCell.bg).toBe('#2e3440');
    expect(activeCell.fg).not.toBe('#d8dee9');
    expect(activeCell.fg).not.toBe(inactiveCell.fg);
    expect(activeCell.modifiers).toContain('bold');
  });

  it('honors an explicit active-tab token override from frame options', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }) {
        if (identity.id === 'frame-header') return { color: '#d8dee9', background: '#2e3440' };
        return {} as Record<string, string>;
      },
    };
    setDefaultContext(ctx);

    const homePage = {
      id: 'home',
      title: 'Home',
      init: () => [{ tone: '#ffaa33' }, []] as const,
      update: (_msg: never, model: { tone: string }) => [model, []] as const,
      layout: () => ({ kind: 'pane' as const, paneId: 'main', render: () => createSurface(1, 1) }),
    };
    const pagesById = new Map([['home', homePage]]);
    const model = {
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: { tone: '#ffaa33' } },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 20,
      rows: 5,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: {} as never,
      runtimeNotificationLoopActive: false,
      warnedFrameKeyCollisionPages: {},
    };

    const header = resolveHeaderLine(model as any, {
      title: 'DOGFOOD',
      pages: [homePage],
      headerStyle: () => ({ activeTabToken: { hex: '#ffaa33', bg: '#332211', modifiers: ['bold'] } }),
    } as any, pagesById as any);

    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    expect(activeTarget).toBeDefined();
    const activeCell = header.surface.get(activeTarget!.startCol + 1, 0);
    expect(activeCell.fg).toBe('#ffaa33');
    expect(activeCell.bg).toBe('#332211');
    expect(activeCell.modifiers).toContain('bold');
  });

  it('preserves existing header modifiers when the active-tab override only changes color', () => {
    const ctx = {
      ...createTestContext({ mode: 'interactive' }),
      resolveBCSS(identity: { type: string; id?: string; classes?: string[] }) {
        if (identity.id === 'frame-header') {
          return {
            color: '#d8dee9',
            background: '#2e3440',
            'text-decoration': 'underline',
          };
        }
        return {} as Record<string, string>;
      },
    };
    setDefaultContext(ctx);

    const homePage = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({ kind: 'pane' as const, paneId: 'main', render: () => createSurface(1, 1) }),
    };
    const pagesById = new Map([['home', homePage]]);
    const model = {
      activePageId: 'home',
      pageOrder: ['home'],
      pageModels: { home: {} },
      focusedPaneByPage: { home: 'main' },
      scrollByPage: {},
      columns: 20,
      rows: 5,
      helpOpen: false,
      transitionProgress: 1,
      transitionGeneration: 0,
      transitionFrame: 0,
      minimizedByPage: {},
      maximizedPaneByPage: {},
      dockStateByPage: {},
      splitRatioOverrides: {},
      runtimeNotifications: {} as never,
      runtimeNotificationLoopActive: false,
      warnedFrameKeyCollisionPages: {},
    };

    const header = resolveHeaderLine(model as any, {
      title: 'DOGFOOD',
      pages: [homePage],
      headerStyle: () => ({ activeTabToken: { hex: '#ffaa33', bg: '#332211' } }),
    } as any, pagesById as any);

    const activeTarget = header.tabTargets.find((target) => target.pageId === 'home');
    expect(activeTarget).toBeDefined();
    const activeCell = header.surface.get(activeTarget!.startCol + 1, 0);
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
        model: {
          splitRatioOverrides: {},
        } as never,
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
    const page = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({
        kind: 'split' as const,
        splitId: 'shell',
        state: { ratio: 0.5, focused: 'a' },
        paneA: { kind: 'pane' as const, paneId: 'left', render: () => parseAnsiToSurface('left', 4, 1) },
        paneB: { kind: 'pane' as const, paneId: 'right', render: () => parseAnsiToSurface('right', 5, 1) },
      }),
    };

    const geometry = renderPageContentInto(
      'home',
      {
        pageModels: { home: {} },
        focusedPaneByPage: { home: 'left' },
        scrollByPage: {},
        minimizedByPage: {},
        dockStateByPage: {},
        splitRatioOverrides: {},
      } as never,
      { row: 2, col: 3, width: 14, height: 4 },
      new Map([[page.id, page]]) as never,
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
    const page = {
      id: 'home',
      title: 'Home',
      init: () => [{}, []] as const,
      update: (_msg: never, model: {}) => [model, []] as const,
      layout: () => ({
        kind: 'split' as const,
        splitId: 'shell',
        state: { ratio: 0.5, focused: 'a' },
        paneA: { kind: 'pane' as const, paneId: 'left', render: () => parseAnsiToSurface('left', 4, 1) },
        paneB: { kind: 'pane' as const, paneId: 'right', render: () => parseAnsiToSurface('right', 5, 1) },
      }),
    };

    const geometry = renderMaximizedPaneInto(
      'home',
      {
        pageModels: { home: {} },
        focusedPaneByPage: { home: 'left' },
        scrollByPage: {},
        minimizedByPage: {},
        dockStateByPage: {},
        splitRatioOverrides: {},
      } as never,
      { row: 1, col: 2, width: 12, height: 3 },
      new Map([[page.id, page]]) as never,
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
