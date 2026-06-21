import {
  _resetDefaultContextForTesting,
  afterEach,
  createSurface,
  createTestContext,
  describe,
  expect,
  frameModel,
  it,
  parseAnsiToSurface,
  renderMaximizedPaneInto,
  renderPageContentInto,
  setDefaultContext,
} from './app-frame-render.test-support.js';

import type { EmptyModel, FramePage, TestMsg } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

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
