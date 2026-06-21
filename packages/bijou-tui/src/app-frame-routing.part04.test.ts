
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  runScript,
  setDefaultContext,
  textView,
  _resetDefaultContextForTesting,
  Cmd,
  FramePage,
  Msg,
  PageModel,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('keeps init command messages scoped to their originating page', async () => {
    const initInc: Cmd<Msg> = () => ({ type: 'inc' });
    const page = (id: string, title: string): FramePage<PageModel, Msg> => ({
      id,
      title,
      init: () => [{ count: 0 }, [initInc]],
      update(msg, model) {
        if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
        return [model, []];
      },
      layout: () => ({
        kind: 'pane',
        paneId: 'main',
        render: () => textView(`${id} pane`),
      }),
    });
    const app = createFramedApp({
      pages: [page('home', 'Home'), page('logs', 'Logs')],
    });
    const result = await runScript(app, []);
    expect(result.model.pageModels.home?.count).toBe(1);
    expect(result.model.pageModels.logs?.count).toBe(1);
  });
});
