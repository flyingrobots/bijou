import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makeLongContent,
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

  it('keeps drawer mouse interactions from leaking through to the underlying page', () => {
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
        render: () => textView(makeLongContent('main')),
      }),
    };

    const app = createFramedApp<PageModel, MsgWithMouse>({
      initialColumns: 80,
      initialRows: 14,
      pages: [page],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: Array.from({ length: 24 }, (_, index) => ({
            id: `setting-${String(index)}`,
            label: `Setting ${String(index)}`,
            valueLabel: index % 2 === 0 ? 'On' : 'Off',
          })),
        }],
      }),
    });

    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);

    const wheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 4,
      row: 5,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(wheel, model);
    const scrolledY = model.settingsScrollY;

    const outsideWheel: MouseMsg = {
      type: 'mouse',
      button: 'none',
      action: 'scroll-down',
      col: 60,
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
      col: 4,
      row: 3,
      shift: false,
      alt: false,
      ctrl: false,
    };
    [model] = app.update(click, model);

    expect(model.settingsScrollY).toBe(scrolledY);
    expect(scrolledY).toBeGreaterThan(0);
    expect(model.pageModels.home?.count).toBe(0);
  });
});
