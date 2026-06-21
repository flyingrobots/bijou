
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  KEY_BACKTICK,
  KEY_ESCAPE,
  makePage,
  runScript,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
  must,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('switches tabs when the user clicks a header tab', async () => {
    const app = createFramedApp({
      title: 'Test',
      pages: [
        makePage('home', 'Home', 'main'),
        makePage('logs', 'Logs', 'main'),
      ],
    });
    const result = await runScript(app, [{
      mouse: {
        type: 'mouse',
        button: 'left',
        action: 'press',
        col: 15,
        row: 0,
        shift: false,
        alt: false,
        ctrl: false,
      },
    }]);
    expect(result.model.activePageId).toBe('logs');
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('toggles help with ?', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: '?' }]);
    expect(result.model.helpOpen).toBe(true);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('closes help with ? when help is open', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: '?' }, { key: '?' }]);
    expect(result.model.helpOpen).toBe(false);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('closes help with escape without opening quit confirm', async () => {
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
    });
    const result = await runScript(app, [{ key: '?' }, { key: KEY_ESCAPE }]);
    expect(result.model.helpOpen).toBe(false);
    expect(result.model.quitConfirmOpen).toBe(false);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('toggles the perf HUD from the workspace and active help layer', async () => {
    const app = createFramedApp({
      initialColumns: 96,
      initialRows: 30,
      pages: [makePage('home', 'Home', 'main')],
    });
    const workspaceResult = await runScript(app, [{ key: KEY_BACKTICK }]);
    expect(workspaceResult.model.perfHudOpen).toBe(true);
    expect(surfaceToString(must(workspaceResult.frames.at(-1)), testCtx.style)).toContain('Perf HUD');
    const helpResult = await runScript(app, [{ key: '?' }, { key: KEY_BACKTICK }]);
    expect(helpResult.model.helpOpen).toBe(true);
    expect(helpResult.model.perfHudOpen).toBe(true);
    expect(surfaceToString(must(helpResult.frames.at(-1)), testCtx.style)).toContain('Perf HUD');
  });
});
