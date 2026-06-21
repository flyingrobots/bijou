import {
  _resetDefaultContextForTesting,
  afterEach,
  createTestContext,
  describe,
  expect,
  frameModel,
  frameOptions,
  it,
  must,
  panePage,
  resolveHeaderLine,
  setDefaultContext,
  surfacePlainText,
} from './app-frame-render.test-support.js';

import type { EmptyModel } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('frame shell chrome surfaces', () => {
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
});

describe('frame shell chrome surfaces', () => {
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
});

describe('frame shell chrome surfaces', () => {
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
});
