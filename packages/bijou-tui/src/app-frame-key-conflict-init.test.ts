import {
  afterAll,
  beforeAll,
  collectCommandMessages,
  createFramedApp,
  createKeyMap,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  _resetDefaultContextForTesting,
  type FramePage,
  type Msg,
} from './app-frame.test-support.js';
import { isFrameScopedMsg } from './app-frame-messages.js';

type Page = FramePage<{ count: number }, Msg>;

function collidingPage(): Page {
  const page = makePage('home', 'Home', 'main');
  return { ...page, keyMap: createKeyMap<Msg>().bind(']', 'Next color', { type: 'inc' }) };
}

async function initWarnings(pages: Page[], extra: object = {}): Promise<string[]> {
  const app = createFramedApp({ pages, ...extra });
  const [, cmds] = app.init();
  const groups = await Promise.all(cmds.map((cmd) => collectCommandMessages(cmd, [])));
  return groups.flat().flatMap((msg) => {
    if (!isFrameScopedMsg(msg)) return [];
    return msg.action.type === 'runtime-issue' ? [msg.action.issue.message] : [];
  });
}

describe('frame key conflicts at init', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('warns at init, with no key pressed, about a page binding that collides with the frame', async () => {
    const warnings = await initWarnings([collidingPage()]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Key ]');
    expect(warnings[0]).toContain('"Next tab" (frame) is checked first');
    expect(warnings[0]).toContain('"Next color" (page "home") never fires');
  });

  it('names the page binding as checked first under keyPriority page-first', async () => {
    const warnings = await initWarnings([collidingPage()], { keyPriority: 'page-first' });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"Next color" (page "home") is checked first');
  });

  it('stays silent when no binding collides, and for the same key on two different pages', async () => {
    const other: Page = { ...makePage('other', 'Other', 'side'), keyMap: createKeyMap<Msg>().bind('x', 'Increment', { type: 'inc' }) };
    expect(await initWarnings([makePage('home', 'Home', 'main'), other])).toEqual([]);
  });

  it('warns once per start, not on update or view', async () => {
    const app = createFramedApp({ pages: [collidingPage()] });
    const [model, cmds] = app.init();
    expect(cmds).toHaveLength(1);
    const [afterUpdate, updateCmds] = app.update({ type: 'resize', columns: 90, rows: 30 }, model);
    app.view(afterUpdate);
    expect(updateCmds).toHaveLength(0);
  });
});
