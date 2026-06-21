
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  describeFrameLayerStack,
  expect,
  it,
  makeModalPage,
  makePage,
  normalizeViewOutput,
  runScript,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('shows settings controls in help when help opens above settings', () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Workspace settings',
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

    let [model] = app.init();
    [model] = app.update({ type: 'key', key: 'f2', ctrl: false, alt: false, shift: false }, model);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);

    expect(model.settingsOpen).toBe(true);
    expect(model.helpOpen).toBe(true);
    expect(describeFrameLayerStack(model).map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);

    const rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );

    expect(rendered).toContain('Close settings');
    expect(rendered).not.toContain('Increment');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('uses page-provided layer registry metadata for workspace and page-modal control projection', async () => {
    const workspaceHelp = createKeyMap<Msg>()
      .bind('enter', 'Open workspace command', { type: 'noop' });
    const modalHelp = createKeyMap<Msg>()
      .bind('enter', 'Apply modal action', { type: 'noop' });
    const page: FramePage<PageModel, Msg> = {
      ...makeModalPage('home', 'Home', 'main'),
      layers(model) {
        return {
          workspace: {
            title: 'Home workspace',
            hintSource: 'Workspace custom hint',
            helpSource: workspaceHelp,
          },
          'page-modal': model.modalOpen
            ? {
                title: 'Inspector',
                hintSource: 'Modal custom hint',
                helpSource: modalHelp,
              }
            : undefined,
        };
      },
    };
    const app = createFramedApp({
      pages: [page],
    });

    let [model] = app.init();
    let rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Workspace custom hint');

    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Open workspace command');
    expect(rendered).not.toContain('Apply modal action');

    model = (await runScript(app, [{ key: 'm' }])).model;
    rendered = surfaceToString(
      normalizeViewOutput(app.view(model), { width: model.columns, height: model.rows }).surface,
      testCtx.style,
    );
    expect(rendered).toContain('Modal custom hint');
  });
});
