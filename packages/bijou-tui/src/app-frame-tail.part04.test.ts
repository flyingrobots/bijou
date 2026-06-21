import {
  afterAll,
  beforeAll,
  createFramedApp,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  FrameOverlayContext,
  PageModel,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

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
    expect(captured?.paneRects.has('left')).toBe(true);
    expect(captured?.paneRects.has('right')).toBe(true);
    // Body starts below the single-line header and above the footer
    expect(must(captured).paneRects.get('left')?.row).toBeGreaterThanOrEqual(1);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

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
});
