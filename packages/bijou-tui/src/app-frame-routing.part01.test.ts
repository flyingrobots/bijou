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
  textView,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('respects transitionOverride to select animation dynamically', () => {
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'none',
      transitionOverride: () => 'wipe',
      transitionDuration: 10,
    });
    const [initModel] = app.init();
    const [switchedModel] = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, initModel);
    expect(switchedModel.activeTransition).toBe('wipe');
    expect(switchedModel.transitionProgress).toBe(0);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('throws for duplicate pane ids in a page layout', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'split',
          splitId: 'dup',
          state: createSplitPaneState({ ratio: 0.5 }),
          paneA: { kind: 'pane', paneId: 'main', render: () => textView('left') },
          paneB: { kind: 'pane', paneId: 'main', render: () => textView('right') },
        }),
      }],
    });
    expect(() => app.init()).toThrow(/duplicate paneId "main"/);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('collects pane ids from declared grid areas only', () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'grid',
          gridId: 'g',
          columns: ['1fr'],
          rows: ['1fr'],
          areas: ['main'],
          cells: {
            main: { kind: 'pane', paneId: 'main', render: () => textView('main') },
            ghost: { kind: 'pane', paneId: 'ghost', render: () => textView('ghost') },
          },
        }),
      }],
    });
    const [model] = app.init();
    expect(model.focusedPaneByPage.home).toBe('main');
    expect(model.scrollByPage.home?.ghost).toBeUndefined();
  });
});
