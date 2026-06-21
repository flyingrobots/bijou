
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
  notify,
  QUIT,
  setDefaultContext,
  surfaceToString,
  textView,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  FramedAppMsg,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
const testCtx = createTestContext();

const commandHooks = (now: number) => ({ onPulse: () => ({ dispose: () => undefined }), sleep: () => Promise.resolve(), now: () => now });

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('lets pages push frame-managed notifications with notify()', async () => {
    const page: FramePage<PageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'inc') {
          return [{
            ...model,
            count: model.count + 1,
          }, [notify<Msg>({
            title: 'Saved draft',
            tone: 'SUCCESS',
            message: 'Frame-managed notification from the page update',
          })]];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp({
      pages: [page],
      runtimeNotifications: {
        placement: 'TOP_CENTER',
        durationMs: 2_500,
      },
    });

    let [model] = app.init();
    let cmds: Cmd<FramedAppMsg<Msg>>[];
    [model, cmds] = app.update({ type: 'inc' }, model);

    expect(model.pageModels.home?.count).toBe(1);
    expect(cmds).toHaveLength(1);

    const returned = await must(cmds[0])(() => undefined, commandHooks(123));

    expect(returned).not.toBeUndefined();
    if (returned === undefined || returned === QUIT || isCmdCleanup(returned)) throw new Error('expected msg');

    [model, cmds] = app.update(returned, model);

    expect(model.runtimeNotifications.items).toHaveLength(1);
    expect(model.runtimeNotifications.items[0]).toMatchObject({
      title: 'Saved draft',
      tone: 'SUCCESS',
      message: 'Frame-managed notification from the page update',
      placement: 'TOP_CENTER',
      durationMs: 2_500,
    });
    expect(cmds).toHaveLength(1);

    const tickMsg = await must(cmds[0])(() => undefined, commandHooks(200));
    expect(tickMsg).not.toBeUndefined();
    if (tickMsg === undefined || tickMsg === QUIT || isCmdCleanup(tickMsg)) throw new Error('expected msg');

    const [visibleModel] = app.update(tickMsg, model);
    const frame = app.view(visibleModel);
    if (typeof frame === 'string' || !('cells' in frame)) throw new Error('expected a surface from framed app');
    expect(surfaceToString(frame, testCtx.style)).toContain('notices:1');
  });
});
