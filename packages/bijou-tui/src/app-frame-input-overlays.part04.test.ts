
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  ctrlKey,
  describe,
  expect,
  it,
  makePage,
  normalizeViewOutput,
  setDefaultContext,
  surfaceToString,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('scrolls a long settings drawer independently of the underlying page', () => {
    const app = createFramedApp({
      initialColumns: 80,
      initialRows: 14,
      pages: [makePage('home', 'Home', 'main')],
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
    [model] = app.update({ type: 'key', key: 'd', ctrl: false, alt: false, shift: false }, model);
    expect(model.settingsScrollY).toBeGreaterThan(0);
    expect(model.scrollByPage.home?.main?.y ?? 0).toBe(0);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('renders settings row descriptions as secondary drawer copy', () => {
    const app = createFramedApp({
      initialColumns: 90,
      initialRows: 18,
      pages: [makePage('home', 'Home', 'main')],
      settings: () => ({
        title: 'Settings',
        sections: [{
          id: 'shell',
          title: 'Shell',
          rows: [{
            id: 'show-hints',
            label: 'Show hints',
            description: 'Show active control cues in the footer.',
            checked: true,
            valueLabel: 'On',
            kind: 'toggle',
          }],
        }],
      }),
    });
    let [model] = app.init();
    [model] = app.update(ctrlKey(','), model);
    const surface = normalizeViewOutput(app.view(model), {
      width: 90,
      height: 18,
    }).surface;
    const rendered = surfaceToString(surface, testCtx.style);
    const lines = rendered.split('\n');
    const shellLine = lines.findIndex((line) => line.includes('Shell'));
    const rowLine = lines.findIndex((line) => line.includes('Show hints'));
    const rowX = rowLine >= 0 ? lines[rowLine]?.indexOf('Show hints') : -1;
    expect(rendered).toContain('Show hints');
    expect(rendered).toContain('☑ On');
    expect(rendered).toContain('Show active control');
    expect(rendered).toContain('cues in the footer');
    expect(rowLine).toBeGreaterThan(shellLine + 1);
    expect(rowX).toBeGreaterThan(0);
    expect(surface.get(rowX, rowLine).bg).toBe(testCtx.surface('elevated').bg);
  });
});
