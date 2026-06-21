
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_CTRL_P,
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

it('blocks page mouse updates while help or the command palette is open', async () => {
    type MsgWithMouse = Msg | MouseMsg;
    const page: FramePage<PageModel, MsgWithMouse> = {
      id: 'home',
      title: 'Home',
      init: () => [{ count: 0 }, []],
      update(msg, model) {
        if (msg.type === 'mouse') {
          return [{ ...model, count: model.count + 1 }, []];
        }
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView('main'),
      }),
      commandItems: () => [{
        id: 'noop',
        label: 'No-op',
        action: { type: 'inc' },
      }],
    };
    const app = createFramedApp<PageModel, MsgWithMouse>({
      pages: [page],
      enableCommandPalette: true,
    });
    const result = await runScript(app, [
      {
        key: '?',
      },
      {
        mouse: {
          type: 'mouse',
          button: 'none',
          action: 'scroll-down',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
      {
        key: '?',
      },
      {
        key: KEY_CTRL_P,
      },
      {
        mouse: {
          type: 'mouse',
          button: 'right',
          action: 'press',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      },
    ]);
    expect(result.model.helpOpen).toBe(false);
    expect(result.model.commandPalette).toBeDefined();
    expect(result.model.pageModels.home?.count).toBe(0);
  });
});
