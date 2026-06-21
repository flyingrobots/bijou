import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
  KEY_ENTER,
  makePage,
  runScript,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  NotificationHistoryFilter,
  NotificationState,
  QUIT,
  isCmdCleanup,
} from './app-frame.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  const hooks = (now: number) => ({ onPulse: () => ({ dispose: () => undefined }), sleep: () => Promise.resolve(), now: () => now });

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('cycles notification-center filters through app-provided filter state', async () => {
    const filters: readonly NotificationHistoryFilter[] = ['ALL', 'ERROR', 'WARNING'];

    type NotificationMsg =
      | { type: 'inc' }
      | { type: 'set-history-filter'; filter: NotificationHistoryFilter };

    interface NotificationPageModel {
      readonly count: number;
      readonly notifications: NotificationState<NotificationMsg>;
      readonly filterIndex: number;
    }

    const page: FramePage<NotificationPageModel, NotificationMsg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: seedNotificationHistory<NotificationMsg>([
          { title: 'Deploy blocked', tone: 'ERROR' },
          { title: 'Queue pressure', tone: 'WARNING' },
        ]),
        filterIndex: 0,
      }, []],
      update(msg, model) {
        if (msg.type === 'set-history-filter') {
          return [{
            ...model,
            filterIndex: Math.max(0, filters.indexOf(msg.filter)),
          }, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<NotificationPageModel, NotificationMsg>({
      pages: [page],
      notificationCenter: ({ pageModel }) => ({
        state: pageModel.notifications,
        filters,
        activeFilter: must(filters[pageModel.filterIndex]),
        onFilterChange: (filter) => ({ type: 'set-history-filter', filter }),
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    const [filteredModel, cmds] = app.update({ type: 'key', key: 'f', ctrl: false, alt: false, shift: false }, model);
    model = filteredModel;

    expect(cmds).toHaveLength(1);
    const returned = await must(cmds[0])(() => undefined, hooks(0));
    if (returned === undefined || returned === QUIT || isCmdCleanup(returned)) throw new Error();
    [model] = app.update(returned, model);

    expect(model.pageModels.home?.filterIndex).toBe(1);
    expect(model.notificationCenterScrollY).toBe(0);
  });
});

describe('createFramedApp', () => {
  const testCtx = createTestContext();

  beforeAll(() => { setDefaultContext(testCtx); });

  afterAll(() => { _resetDefaultContextForTesting(); });

  it('opens the shell notification center from the command palette', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      enableCommandPalette: true,
    });

    const result = await runScript(app, [
      { key: KEY_CTRL_P },
      { key: 'n' },
      { key: 'o' },
      { key: 't' },
      { key: KEY_ENTER },
    ]);

    expect(result.model.notificationCenterOpen).toBe(true);
    expect(result.model.commandPalette).toBeUndefined();
  });
});
