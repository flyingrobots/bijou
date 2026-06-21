import {
  activeRuntimeView,
  afterAll,
  beforeAll,
  createKeyMap,
  createTestContext,
  describe,
  describeFrameRuntimeViewStack,
  expect,
  it,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

import { createCommandPaletteState } from './command-palette.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('backs frame layer introspection with a runtime view stack', () => {
    const workspaceHelp = createKeyMap<{ type: 'noop' }>()
      .bind('tab', 'Next pane', { type: 'noop' });
    const settingsHelp = createKeyMap<{ type: 'noop' }>()
      .bind('escape', 'Close settings', { type: 'noop' });
    const searchHelp = createKeyMap<{ type: 'noop' }>()
      .bind('enter', 'Select', { type: 'noop' });

    const model = {
      helpOpen: false,
      commandPalette: createCommandPaletteState([]),
      commandPaletteKind: 'search' as const,
      settingsOpen: true,
      notificationCenterOpen: false,
      quitConfirmOpen: false,
    };

    const stack = describeFrameRuntimeViewStack(model, {
      layers: {
        workspace: {
          title: 'Workspace',
          helpSource: workspaceHelp,
        },
        settings: {
          title: 'Workspace settings',
          hintSource: 'F2/Esc close',
          helpSource: settingsHelp,
        },
        search: {
          title: 'Search components',
          hintSource: 'Enter select • Esc close',
          helpSource: searchHelp,
        },
      },
    });

    expect(stack.layers.map((layer) => ({
      root: layer.root,
      kind: layer.kind,
      dismissible: layer.dismissible,
      blocksBelow: layer.blocksBelow,
      title: layer.model?.title,
    }))).toEqual([
      {
        root: true,
        kind: 'workspace',
        dismissible: false,
        blocksBelow: false,
        title: 'Workspace',
      },
      {
        root: false,
        kind: 'settings',
        dismissible: true,
        blocksBelow: true,
        title: 'Workspace settings',
      },
      {
        root: false,
        kind: 'search',
        dismissible: true,
        blocksBelow: true,
        title: 'Search components',
      },
    ]);

    expect(activeRuntimeView(stack)?.model).toMatchObject({
      kind: 'search',
      title: 'Search components',
      hintSource: 'Enter select • Esc close',
      inputMapId: 'frame-search',
    });
  });
});
