import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makeLongContent,
  setDefaultContext,
  textView,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
  type FramePage,
} from './app-frame.test-support.js';

interface ContentModel {
  readonly lines: number;
  readonly overflowX: 'scroll' | 'hidden';
}
interface ContentMsg { readonly type: 'replace'; readonly content: ContentModel }

function contentApp(initialLines: () => number = () => 100) {
  const page: FramePage<ContentModel, ContentMsg> = {
    id: 'home',
    title: 'Home',
    init: () => [{ lines: initialLines(), overflowX: 'scroll' }, []],
    update: (msg, model) => [msg.type === 'replace' ? msg.content : model, []],
    layout: (model) => ({
      kind: 'pane',
      paneId: 'main',
      overflowX: model.overflowX,
      render: () => textView(makeLongContent('x'.repeat(80), model.lines)),
    }),
  };
  return createFramedApp({ pages: [page], initialColumns: 40, initialRows: 12 });
}

describe('cached measurements preserve changed content semantics', () => {
  beforeAll(() => { setDefaultContext(createTestContext()); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('measures fresh page content when the same framed app is initialized again', () => {
    let lines = 100;
    const app = contentApp(() => lines);
    let [model] = app.init();
    [model] = app.update(wrapFrameMsg({ type: 'bottom' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(90);

    lines = 3;
    [model] = app.init();
    expect(model.pageModels['home']?.lines).toBe(3);
    [model] = app.update(wrapFrameMsg({ type: 'bottom' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(0);
  });

  it('clamps a previously scrolled pane after content shrinks at the same terminal size', () => {
    const app = contentApp();
    let [model] = app.init();
    [model] = app.update(wrapFrameMsg({ type: 'bottom' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(90);
    [model] = app.update({ type: 'replace', content: { lines: 3, overflowX: 'scroll' } }, model);
    [model] = app.update(wrapFrameMsg({ type: 'scroll-down' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(0);
  });

  it('discards horizontal offset when a page changes overflow to hidden', () => {
    const app = contentApp();
    let [model] = app.init();
    [model] = app.update(wrapFrameMsg({ type: 'scroll-right' }), model);
    expect(model.scrollByPage['home']?.['main']?.x).toBe(1);
    [model] = app.update({ type: 'replace', content: { lines: 100, overflowX: 'hidden' } }, model);
    [model] = app.update(wrapFrameMsg({ type: 'scroll-right' }), model);
    expect(model.scrollByPage['home']?.['main']?.x).toBe(0);
  });

  it('uses the resized viewport when scrolling to the bottom again', () => {
    const app = contentApp();
    let [model] = app.init();
    [model] = app.update(wrapFrameMsg({ type: 'bottom' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(90);
    [model] = app.update({ type: 'resize', columns: 40, rows: 22 }, model);
    [model] = app.update(wrapFrameMsg({ type: 'bottom' }), model);
    expect(model.scrollByPage['home']?.['main']?.y).toBe(80);
  });
});
