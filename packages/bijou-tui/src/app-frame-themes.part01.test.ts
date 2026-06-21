import {
  activeFrameLayer,
  afterAll,
  beforeAll,
  createKeyMap,
  createTestContext,
  describe,
  describeFrameLayerStack,
  expect,
  it,
  setDefaultContext,
  underlyingFrameLayer,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

import { createCommandPaletteState } from './command-palette.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('supports richer explicit layer titles and control sources for shell introspection', () => {
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

    const stack = describeFrameLayerStack(model, {
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
        search: {
          title: 'Search components',
          hintSource: 'Enter select • Esc close',
          helpSource: searchHelp,
        },
      },
    });

    expect(stack.map((layer) => ({ kind: layer.kind, title: layer.title }))).toEqual([
      { kind: 'workspace', title: 'Workspace' },
      { kind: 'settings', title: 'Workspace settings' },
      { kind: 'search', title: 'Search components' },
    ]);
    expect(activeFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })).toMatchObject({
      kind: 'search',
      title: 'Search components',
      hintSource: 'Enter select • Esc close',
      inputMapId: 'frame-search',
    });
    expect(underlyingFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })).toMatchObject({
      kind: 'settings',
      title: 'Workspace settings',
      hintSource: 'F2/Esc close',
      inputMapId: 'frame-settings',
    });
    expect(underlyingFrameLayer(model, {
      layers: {
        workspace: { title: 'Workspace', helpSource: workspaceHelp },
        settings: { title: 'Workspace settings', hintSource: 'F2/Esc close', helpSource: settingsHelp },
        search: { title: 'Search components', hintSource: 'Enter select • Esc close', helpSource: searchHelp },
      },
    })?.helpSource).toBe(settingsHelp);
  });
});
