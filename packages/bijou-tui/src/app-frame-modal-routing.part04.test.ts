
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  normalizeViewOutput,
  pushNotification,
  seedNotificationHistory,
  setDefaultContext,
  shiftKey,
  surfaceToString,
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

it('renders the shell notification center with calmer section spacing and inset notice rows', () => {
    interface NotificationPageModel extends PageModel {
      readonly notifications: NotificationState<Msg>;
    }

    const archived = seedNotificationHistory<Msg>([
      { title: 'Archived info', tone: 'INFO' },
      { title: 'Archived warning', tone: 'WARNING' },
    ]);
    const live = pushNotification(archived, {
      title: 'Deploy failed',
      message: 'The worker crashed before boot.',
      tone: 'ERROR',
      durationMs: null,
    }, 999);

    const page: FramePage<NotificationPageModel, Msg> = {
      id: 'home',
      title: 'Home',
      init: () => [{
        count: 0,
        notifications: archived,
      }, []],
      update(_msg, model) {
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('home'),
      }),
    };

    const app = createFramedApp<NotificationPageModel, Msg>({
      initialColumns: 90,
      initialRows: 18,
      pages: [page],
      notificationCenter: () => ({
        state: live,
      }),
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 90,
      height: 18,
    }).surface;
    const lines = surfaceToString(surface, testCtx.style).split('\n');
    const liveLine = lines.findIndex((line) => line.includes('Live: 1 • Archived: 2'));
    const stackLine = lines.findIndex((line) => line.includes('Current stack'));
    const noticeLine = lines.findIndex((line) => line.includes('Deploy failed'));
    const historyLine = lines.findIndex((line) => line.includes('History • All'));

    expect(liveLine).toBeGreaterThanOrEqual(0);
    expect(stackLine).toBeGreaterThan(liveLine + 1);
    expect(noticeLine).toBeGreaterThan(stackLine + 1);
    expect(lines[noticeLine]?.indexOf('Deploy failed')).toBeGreaterThan(0);
    expect(historyLine).toBeGreaterThan(noticeLine + 2);
  });
});
