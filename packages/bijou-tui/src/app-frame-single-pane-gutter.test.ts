import {
  afterAll,
  beforeAll,
  createFramedApp,
  createSplitPaneState,
  createTestContext,
  describe,
  expect,
  it,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';
import type { FrameLayoutNode } from './app-frame-layout-contract.js';

const GUTTER = '▎';

/** Render a one-page frame with the given layout and return its body row: the line below the header. */
function bodyRow(layout: FrameLayoutNode): string {
  const app = createFramedApp({
    pages: [{ id: 'home', title: 'Home', init: () => [{ count: 0 }, []], update: (_msg, model) => [model, []], layout: () => layout }],
  });
  const [model] = app.init();
  const view = app.view(model);
  if (!('get' in view)) throw new Error('expected a surface view');
  return Array.from({ length: view.width }, (_, x) => view.get(x, 1).char).join('');
}

describe('frame focus gutter', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('omits the focus gutter when the page is a single pane, so content starts at column 0', () => {
    const row = bodyRow({ kind: 'pane', paneId: 'main', render: () => textView('body') });
    expect(row.startsWith('body')).toBe(true);
    expect(row).not.toContain(GUTTER);
  });

  it('keeps the focus gutter when the page has several panes to focus', () => {
    const row = bodyRow({
      kind: 'split', splitId: 'shell', state: createSplitPaneState({ ratio: 0.5 }),
      paneA: { kind: 'pane', paneId: 'left', render: () => textView('left') },
      paneB: { kind: 'pane', paneId: 'right', render: () => textView('right') },
    });
    expect(row.startsWith(GUTTER)).toBe(true);
  });
});
