import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  setDefaultContext,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';
import { countingFixture } from './app-frame-scroll-measure-cache.test-support.js';

describe('focused-pane scroll measurement cache', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  const scroll = wrapFrameMsg({ type: 'scroll-down' });
  const size = { initialColumns: 100, initialRows: 30 };

  it('reuses one measurement across repeated scroll actions', () => {
    const { counts, pages } = countingFixture();
    const app = createFramedApp({ pages, ...size });
    let [model] = app.init();
    [model] = app.update(scroll, model);
    const afterFirst = { ...counts };
    for (let i = 0; i < 5; i += 1) [model] = app.update(scroll, model);
    expect(counts).toEqual(afterFirst);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(6);
  });

  it('reuses the measurement on the key-repeat path', () => {
    const { counts, pages } = countingFixture();
    const app = createFramedApp({ pages, ...size });
    let [model] = app.init();
    const j = { type: 'key' as const, key: 'j', ctrl: false, alt: false, shift: false };
    [model] = app.update(j, model);
    const afterFirst = { ...counts };
    [model] = app.update(j, model);
    [model] = app.update(j, model);
    expect(counts).toEqual(afterFirst);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(3);
  });

  it('keeps one cache per runtime', () => {
    const a = countingFixture();
    const b = countingFixture();
    const appA = createFramedApp({ pages: a.pages, ...size });
    const appB = createFramedApp({ pages: b.pages, ...size });
    let [modelA] = appA.init();
    const [modelB] = appB.init();
    const initB = b.counts.layout;
    [modelA] = appA.update(scroll, modelA);
    [modelA] = appA.update(scroll, modelA);
    expect(b.counts.layout).toBe(initB);
    appB.update(scroll, modelB);
    expect(b.counts.layout).toBe(initB + 1);
    expect(modelA.scrollByPage['home']?.['main']?.y).toBe(2);
  });
});
