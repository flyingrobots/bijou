import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ESCAPE,
  makeModalPage,
  makePage,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('lets q remain text input inside the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P }, // ctrl+p
      { key: 'q' },
    ]);

    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.quitConfirmOpen).toBe(false);
    expect(result.model.commandPalette?.query).toBe('q');
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('derives footer hints from the topmost active layer input map', async () => {
    const app = createFramedApp({
      pages: [makeModalPage('home', 'Home', 'main')],
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

    let model = (await runScript(app, [{ key: 'm' }])).model;

    let frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    let footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('Escape Close modal');
    expect(footer).not.toContain('x Increment');

    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('Escape Close modal');
    expect(footer).not.toContain('F2/Esc close');

    model = (await runScript(app, [{ key: 'm' }, { key: KEY_ESCAPE }])).model;
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    frame = normalizeViewOutput(app.view(model), {
      width: model.columns,
      height: model.rows,
    }).surface;
    footer = surfaceToString(frame, testCtx.style).split('\n').at(-1) ?? '';
    expect(footer).toContain('F2/Esc close');
    expect(footer).not.toContain('Escape Close modal');
  });
});
