
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makePage,
  normalizeViewOutput,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('routes key ownership through the runtime view stack before page bindings', () => {
    const observed: string[] = [];
    const app = createFramedApp<PageModel, Msg>({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
          }],
        }],
      }),
      enableCommandPalette: true,
      observeKey(msg, route) {
        observed.push(`${route}:${msg.ctrl ? 'ctrl+' : ''}${msg.key}`);
        return undefined;
      },
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    expect(model.settingsOpen).toBe(true);

    const [pageKeyModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    model = pageKeyModel;
    expect(model.pageModels.home?.count).toBe(0);
    expect(cmds).toHaveLength(0);

    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(true);

    [model] = app.update(ctrlKey('p'), model);
    expect(model.commandPalette).toBeUndefined();

    [model] = app.update({ type: 'key', key: 'escape', ctrl: false, alt: false, shift: false }, model);
    expect(model.helpOpen).toBe(false);

    [model] = app.update({ type: 'key', key: '/', ctrl: false, alt: false, shift: false }, model);
    expect(model.commandPaletteKind).toBe('search');

    app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);

    expect(observed).toEqual([
      'frame:ctrl+,',
      'frame:x',
      'frame:?',
      'help:ctrl+p',
      'help:escape',
      'frame:/',
      'palette:x',
    ]);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('shows a shell-owned toast when a settings row is activated', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            valueLabel: 'On',
            kind: 'toggle',
            action: { type: 'toggle-hints' },
            feedback: {
              title: 'Settings',
              message: 'Show hints turned off.',
            },
          }],
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const [nextModel, cmds] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);

    expect(cmds).toHaveLength(2);
    expect(nextModel.runtimeNotifications.items).toHaveLength(1);
    expect(nextModel.runtimeNotifications.items[0]?.title).toBe('Settings');
    expect(nextModel.runtimeNotifications.items[0]?.message).toBe('Show hints turned off.');

    const rendered = surfaceToString(normalizeViewOutput(app.view(nextModel), {
      width: testCtx.runtime.columns,
      height: testCtx.runtime.rows,
    }).surface, testCtx.style);
    expect(rendered).toContain('notices:1');
  });
});
