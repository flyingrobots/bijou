
import {
  afterAll,
  beforeAll,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  projectFrameControls,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('projects footer and help controls from the explicit frame layer stack', () => {
    const workspaceHelp = createKeyMap<{ type: 'noop' }>()
      .bind('tab', 'Next pane', { type: 'noop' });
    const settingsHelp = createKeyMap<{ type: 'noop' }>()
      .bind('enter', 'Apply settings', { type: 'noop' });

    const projection = projectFrameControls({
      helpOpen: true,
      commandPalette: undefined,
      commandPaletteKind: undefined,
      settingsOpen: true,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
    }, {
      layers: {
        workspace: {
          title: 'Workspace',
          hintSource: 'Tab next pane',
          helpSource: workspaceHelp,
        },
        settings: {
          title: 'Workspace settings',
          hintSource: 'F2/Esc close',
          helpSource: settingsHelp,
        },
        help: {
          title: 'Keyboard Help',
          hintSource: 'j/k scroll • Esc close',
        },
      },
    });

    expect(projection.layerStack.map((layer) => layer.kind)).toEqual(['workspace', 'settings', 'help']);
    expect(projection.activeLayer).toMatchObject({
      kind: 'help',
      title: 'Keyboard Help',
      hintSource: 'j/k scroll • Esc close',
    });
    expect(projection.underlyingLayer).toMatchObject({
      kind: 'settings',
      title: 'Workspace settings',
    });
    expect(projection.footerHintSource).toBe('j/k scroll • Esc close');
    expect(projection.helpSource).toBe(settingsHelp);
  });
});
