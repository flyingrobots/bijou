
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  runScript,
  setDefaultContext,
  stringToSurface,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('switches tabs with [ and ]', async () => {
    const app = createFramedApp({
      title: 'Test',
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });

    const result = await runScript(app, [{ key: ']' }]);
    expect(result.model.activePageId).toBe('logs');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('supports pane renderers that return a Surface', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => stringToSurface('surface-pane', 12, 1),
        }),
      }],
    });

    const result = await runScript(app, []);
    expect(surfaceToString(must(result.frames.at(-1)), testCtx.style)).toContain('surface-pane');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('supports pane renderers that return a LayoutNode', async () => {
    const app = createFramedApp({
      pages: [{
        id: 'home',
        title: 'Home',
        init: () => [{ count: 0 }, []],
        update: (msg, model) => [model, []],
        layout: () => ({
          kind: 'pane',
          paneId: 'main',
          render: () => ({
            type: 'PaneNode',
            rect: { x: 0, y: 0, width: 11, height: 1 },
            children: [],
            surface: stringToSurface('layout-pane', 11, 1),
          }),
        }),
      }],
    });

    const result = await runScript(app, []);
    expect(surfaceToString(must(result.frames.at(-1)), testCtx.style)).toContain('layout-pane');
  });
});
