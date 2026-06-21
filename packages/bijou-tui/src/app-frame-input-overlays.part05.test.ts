
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createSplitPaneState,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makeLongContent,
  makePage,
  normalizeViewOutput,
  setDefaultContext,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('fills the entire frame body with the primary surface background', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'split',
        splitId: 'body-split',
        state: createSplitPaneState({ ratio: 0.5 }),
        paneA: { kind: 'pane', paneId: 'left', render: () => textView(makeLongContent('left', 12)) },
        paneB: { kind: 'pane', paneId: 'right', render: () => textView(makeLongContent('right', 12)) },
      }),
    };
    const app = createFramedApp({
      initialColumns: 24,
      initialRows: 6,
      pages: [page],
    });
    const [model] = app.init();
    const surface = normalizeViewOutput(app.view(model), {
      width: 24,
      height: 6,
    }).surface;
    const expectedBg = testCtx.surface('primary').bg;
    expect(expectedBg).toBeDefined();
    for (let y = 1; y < surface.height - 1; y++) {
      for (let x = 0; x < surface.width; x++) {
        expect(surface.get(x, y).bg).toBe(expectedBg);
      }
    }
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('stacks long settings values beneath the label when inline space is too tight', () => {
    const app = createFramedApp({
      initialColumns: 72,
      initialRows: 18,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'appearance',
          title: 'Appearance',
          rows: [{
            id: 'theme',
            label: 'Landing theme',
            valueLabel: 'Storybook Workstation',
            kind: 'choice',
          }],
        }],
      }),
    });
    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 72,
      height: 18,
    }).surface;
    const lines = surfaceToString(surface, testCtx.style).split('\n');
    const labelLine = lines.findIndex((line) => line.includes('Landing theme'));
    const valueLine = lines.findIndex((line) => line.includes('Storybook Workstation'));
    expect(labelLine).toBeGreaterThanOrEqual(0);
    expect(valueLine).toBe(labelLine + 1);
  });
});
