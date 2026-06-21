import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  makeLongContent,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  Msg,
  NotificationState,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('scrolls a shell notification center independently of the underlying page', () => {
    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<Msg>;
    }

    const notifications = seedNotificationHistory<Msg>(
      Array.from({ length: 18 }, (_, index) => ({
        title: `Notice ${String(index)}`,
        tone: index % 2 === 0 ? 'WARNING' : 'INFO',
      })),
    );

    const page: FramePage<NotificationPageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications,
      }, []],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('home:main')),
      }),
      keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }),
    };

    const app = createFramedApp<NotificationPageModel, Msg>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);

    expect(model.notificationCenterOpen).toBe(true);
    expect(model.notificationCenterScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);

    const [nextModel, cmds] = app.update({ type: 'key', key: 'x', ctrl: false, alt: false, shift: false }, model);
    expect(nextModel.pageModels.home?.count).toBe(0);
    expect(nextModel.notificationCenterOpen).toBe(true);
    expect(cmds).toHaveLength(0);
  });
});
