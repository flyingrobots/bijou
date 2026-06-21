import {
  _resetDefaultContextForTesting,
  afterEach,
  createPanelDockState,
  createPanelVisibilityState,
  createTestContext,
  describe,
  expect,
  frameModel,
  it,
  parseAnsiToSurface,
  renderFrameNode,
  setDefaultContext,
} from './app-frame-render.test-support.js';

import type { EmptyModel } from './app-frame-render.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

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
