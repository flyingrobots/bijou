import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp settings availability', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('closes settings after its last row becomes unavailable', () => {
    let hasRows = true;
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: hasRows
            ? [{ id: 'hints', label: 'Hints', valueLabel: 'On' }]
            : [],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update({
      type: 'key', key: 'f2', ctrl: false, alt: false, shift: false,
    }, model);
    expect(model.settingsOpen).toBe(true);

    hasRows = false;
    [model] = app.update({
      type: 'key', key: 'f2', ctrl: false, alt: false, shift: false,
    }, model);
    expect(model.settingsOpen).toBe(false);
  });
});
