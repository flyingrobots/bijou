
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  isCmdCleanup,
  it,
  QUIT,
  runScript,
  setDefaultContext,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
const testCtx = createTestContext();

const commandRuntime = {
    onPulse: () => ({ dispose: () => undefined }),
    sleep: () => Promise.resolve(),
    now: () => 0,
  };

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('warns only once per page for frame-first binding collisions', async () => {
    const page = (id: string, title: string): FramePage<PageModel, Msg> => ({
      id,
      title,
      init: () => [{ count: 0 }, []],
      update: (msg, model) => [model, []],
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(title),
      }),
      keyMap: createKeyMap<Msg>().bind('?', `${title} help`, { type: 'noop' }),
    });
    const app = createFramedApp({
      pages: [page('home', 'Home'), page('logs', 'Logs')],
    });
    const [initialModel, initCmds] = app.init();
    let model = initialModel;
    expect(initCmds).toHaveLength(0);
    let update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(update[1]).toHaveLength(1);
    const homeWarning = await update[1][0]?.(() => undefined, commandRuntime);
    if (homeWarning == null || homeWarning === QUIT || isCmdCleanup(homeWarning)) {
      throw new Error('expected home collision warning');
    }
    [model] = app.update(homeWarning, model);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    update = app.update({ type: 'key', key: ']', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('logs');
    expect(update[1]).toHaveLength(0);
    update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(update[1]).toHaveLength(1);
    const logsWarning = await update[1][0]?.(() => undefined, commandRuntime);
    if (logsWarning == null || logsWarning === QUIT || isCmdCleanup(logsWarning)) {
      throw new Error('expected logs collision warning');
    }
    [model] = app.update(logsWarning, model);
    expect(model.runtimeNotifications.items).toHaveLength(2);
    [model] = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    update = app.update({ type: 'key', key: '[', ctrl: false, alt: false, shift: false }, model);
    model = update[0];
    expect(model.activePageId).toBe('home');
    expect(update[1]).toHaveLength(0);
    update = app.update({ type: 'key', key: '?', ctrl: false, alt: false, shift: false }, model);
    expect(update[1]).toHaveLength(0);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('can override the short help strip with page bindings only', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
      keyMap: createKeyMap<Msg>()
        .bind('l', 'Cycle placement', { type: 'inc' })
        .bind('q', 'Quit demo', { type: 'noop' }),
    };
    const app = createFramedApp({
      title: 'Test',
      pages: [page],
      helpLineSource: ({ activePage }) => activePage.keyMap,
    });
    const result = await runScript(app, []);
    const frame = surfaceToString(must(result.frames.at(-1)), testCtx.style);
    expect(frame).toContain('l Cycle placement');
    expect(frame).toContain('q Quit demo');
    expect(frame).not.toContain('[ Previous tab');
    expect(frame).not.toContain('Tab Next pane');
  });
});
