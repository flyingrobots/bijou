import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makePage,
  runScript,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('opens settings from the standard command palette entry', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
          }],
        }],
      }),
    });
    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 's' },
      { key: 'e' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);
    expect(result.model.settingsOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });
});
