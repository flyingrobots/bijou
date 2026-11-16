import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  type FramePage,
  type Msg,
  type PageModel,
} from './app-frame.test-support.js';

const key = (name: string) => ({ type: 'key', key: name, ctrl: false, alt: false, shift: false }) as const;
const scrollY = (model: unknown): number =>
  typeof model === 'object' && model !== null && 'helpScrollY' in model && typeof model.helpScrollY === 'number' ? model.helpScrollY : -1;

describe('frame help overlay arrow keys', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('scrolls a help overlay taller than the screen with the down and up arrows', () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update: (_msg, model) => [model, []],
      layout: () => ({ kind: 'pane', paneId: 'main', render: () => textView('main') }),
      keyMap: createKeyMap<Msg>().group('Extra', (group) => {
        let next = group;
        for (let index = 0; index < 32; index++) next = next.bind(String(index % 10), `Binding ${String(index)}`, { type: 'noop' });
        return next;
      }),
    };
    const app = createFramedApp({ initialColumns: 80, initialRows: 16, pages: [page] });
    let [model] = app.init();
    [model] = app.update(key('?'), model);
    [model] = app.update(key('down'), model);
    const scrolled = scrollY(model);
    expect(scrolled).toBeGreaterThan(0);
    [model] = app.update(key('up'), model);
    expect(scrollY(model)).toBeLessThan(scrolled);
    expect(model.helpOpen).toBe(true);
  });
});
