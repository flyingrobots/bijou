import {
  _resetDefaultContextForTesting,
  afterEach,
  createSurface,
  createTestContext,
  describe,
  expect,
  frameModel,
  frameOptions,
  framePaneOutputToSurface,
  it,
  must,
  panePage,
  resolveHeaderLine,
  setDefaultContext,
} from './app-frame-render.test-support.js';

import type { EmptyModel, LayoutNode } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('frame shell chrome surfaces', () => {
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
