
import {
  afterAll,
  beforeAll,
  createFramedApp,
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
  MouseMsg,
  Msg,
  NotificationState,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('keeps notification-center mouse interactions from leaking through to the underlying page', () => {
    type MsgWithMouse = Msg | MouseMsg;

    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<MsgWithMouse>;
    }

    const page: FramePage<NotificationPageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<MsgWithMouse>(
          Array.from({ length: 20 }, (_, index) => ({
            title: `Notice ${String(index)}`,
            tone: index % 2 === 0 ? 'SUCCESS' : 'WARNING',
          })),
        ),
      }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<NotificationPageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 76,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel, model);
    const scrolledY = model.notificationCenterScrollY;

    const outsideWheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 10,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(outsideWheel, model);

    const click: MouseMsg = {
      type: 'mouse',
      button: 'left',
      action: 'press',
      col: 76,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click, model);

    expect(model.notificationCenterScrollY).toBe(scrolledY);
    expect(scrolledY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });
});
