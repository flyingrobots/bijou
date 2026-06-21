
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  mouseMove,
  mousePress,
  mouseRelease,
  runScript,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  FramePage,
  MouseMsg,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('supports Shift+G for scroll-to-bottom', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: 'G' }]);
    expect(result.model.scrollByPage.home?.main?.y).toBeGreaterThan(0);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('forwards unmapped workspace mouse messages to the active page', async () => {
    type MsgWithMouse = Msg | MouseMsg;
    const seenMouseActions: string[] = [];
    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          seenMouseActions.push(`${msg.button}:${msg.action}:${String(msg.col)}:${String(msg.row)}`);
          return [model, []];
        }
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      keyMap: createKeyMap<MsgWithMouse>().bind('x', 'Increment', { type: 'inc' }),
    };
    const app = createFramedApp<PageModel, MsgWithMouse>({ pages: [page] });
    const result = await runScript(app, [
      mouseMove(4, 2),
      mouseRelease('left', 5, 3),
      mousePress('right', 6, 4),
      mousePress('left', 7, 5),
      { key: 'x' },
    ]);
    expect(seenMouseActions).toEqual([
      'none:move:4:2',
      'left:release:5:3',
      'right:press:6:4',
      'left:press:7:5',
    ]);
    expect(result.model.pageModels.home?.count).toBe(1);
  });
});
