
import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createNotificationState,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makePage,
  normalizeViewOutput,
  pushNotification,
  setDefaultContext,
  shiftKey,
  surfaceHasBg,
  surfaceHasFg,
  surfaceToString,
  _resetDefaultContextForTesting,
  Msg,
  QUIT,
  isCmdCleanup,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('uses the active shell theme for the notification center drawer with an explicit ctx', () => {
    const explicitCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 90, rows: 18 },
    });
    const alternateTheme = createAlternateShellTheme(explicitCtx);
    const live = pushNotification(createNotificationState<Msg>(), {
      title: 'Deploy failed',
      message: 'The worker crashed before boot.',
      tone: 'ERROR',
      durationMs: null,
    }, 999);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        initialColumns: 90,
        initialRows: 18,
        pages: [makePage('home', 'Home', 'main')],
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
        notificationCenter: () => ({
          state: live,
        }),
      });

      let [model] = app.init();
      [model] = app.update(ctrlKey(','), model);
      [model] = app.update({ type: 'key', key: 'enter', ctrl: false, alt: false, shift: false }, model);
      [model] = app.update(shiftKey('n'), model);

      const surface = normalizeViewOutput(app.view(model), {
        width: explicitCtx.runtime.columns,
        height: explicitCtx.runtime.rows,
      }).surface;
      const rendered = surfaceToString(surface, explicitCtx.style);

      expect(rendered).toContain('Notifications');
      expect(rendered).toContain('Deploy failed');
      expect(surfaceHasBg(surface, '#18324a')).toBe(true);
      expect(surfaceHasFg(surface, '#ff66cc')).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

const hooks = (now: number) => ({ onPulse: () => ({ dispose: () => undefined }), sleep: () => Promise.resolve(), now: () => now });

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('surfaces a footer notification cue when archived shell notifications exist', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });

    const [model] = app.init();
    const runtimeMsg = app.routeRuntimeIssue?.({
      level: 'warning',
      source: 'runtime',
      message: 'Framework warning',
      atMs: 0,
    });
    if (runtimeMsg == null) throw new Error('runtime');

    const [nextModel, cmds] = app.update(runtimeMsg, model);
    const tickMsg = await must(cmds[0])(() => undefined, hooks(8_000));
    if (tickMsg === undefined || tickMsg === QUIT || isCmdCleanup(tickMsg)) throw new Error();
    const [archivedModel] = app.update(tickMsg, nextModel);
    const frame = app.view(archivedModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    const footer = must(surfaceToString(frame, testCtx.style).split('\n').at(-1));
    expect(footer).toContain('notices:1');
  });
});
