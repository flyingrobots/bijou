import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  must,
  runScript,
  setDefaultContext,
  stringToSurface,
  surfaceToString,
  _resetDefaultContextForTesting,
  type FramePage,
  type Msg,
  type PageModel,
} from './app-frame.test-support.js';

const WIDE_LINES = 70;
const NARROW_LINES = 30;
const ROWS = 24;
const COLUMNS = 80;
const BODY_HEIGHT = ROWS - 2;

// The pane's content height depends on the width it is given, like wrapped
// prose: a narrow split pane is shorter than the full-body maximized pane.
function lineCount(width: number): number {
  return width >= COLUMNS ? WIDE_LINES : NARROW_LINES;
}

const page: FramePage<PageModel, Msg> = {
  id: 'home',
  title: 'Home',
  init: () => [{ count: 0 }, []],
  update: (_msg, model) => [model, []],
  layout: () => ({
    kind: 'split',
    splitId: 'shell',
    state: { ratio: 0.5, focused: 'a' },
    paneA: {
      kind: 'pane',
      paneId: 'main',
      render: (width) => {
        const count = lineCount(width);
        const text = Array.from({ length: count }, (_, i) => `row ${String(i)}`).join('\n');
        return stringToSurface(text, Math.max(1, width), count);
      },
    },
    paneB: { kind: 'pane', paneId: 'side', render: () => stringToSurface('side', 4, 1) },
  }),
};

describe('framed app maximized pane scrolling', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('clamps a maximized pane to its painted full-body size and reaches the last line', async () => {
    const app = createFramedApp({ initialColumns: COLUMNS, initialRows: ROWS, pages: [page] });
    const result = await runScript(app, [{ key: '\x06' }, { key: 'G' }]);

    expect(result.model.maximizedPaneByPage['home']?.maximizedPaneId).toBe('main');
    expect(result.model.scrollByPage['home']?.['main']?.y).toBe(WIDE_LINES - BODY_HEIGHT);
    const painted = surfaceToString(must(result.frames.at(-1)), testCtx.style);
    expect(painted).toContain(`row ${String(WIDE_LINES - 1)}`);
  });
});
