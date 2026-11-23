import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  setDefaultContext,
  wrapFrameMsg,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';
import type { PulseMsg } from './types.js';
import { countingFixture } from './app-frame-scroll-measure-cache.test-support.js';

describe('focused-pane scroll measurement cache invalidation', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  const scroll = wrapFrameMsg({ type: 'scroll-down' });
  const size = { initialColumns: 100, initialRows: 30 };
  const explicitCtx = createTestContext({ mode: 'interactive' });
  type Input = ReturnType<typeof wrapFrameMsg> | PulseMsg | { readonly type: 'inc' };
  const invalidators: readonly (readonly [string, readonly Input[]])[] = [
    ['a page message', [{ type: 'inc' }]],
    ['a pulse', [{ type: 'pulse', dt: 16 }]],
    ['a shell theme mode change', [wrapFrameMsg({ type: 'toggle-shell-theme-mode' })]],
    ['a minimise', [wrapFrameMsg({ type: 'toggle-minimize' })]],
    ['a dock move', [wrapFrameMsg({ type: 'dock-left' })]],
    ['a maximise', [wrapFrameMsg({ type: 'toggle-maximize' })]],
    ['a focus move and back', [wrapFrameMsg({ type: 'next-pane' }), wrapFrameMsg({ type: 'prev-pane' })]],
    ['a page switch and back', [wrapFrameMsg({ type: 'next-tab' }), wrapFrameMsg({ type: 'prev-tab' })]],
  ];

  it.each(invalidators)('re-measures after %s with page, pane, columns and rows unchanged', (_name, input) => {
    const { counts, pages } = countingFixture();
    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        ctx: explicitCtx,
        pages,
        ...size,
        shellThemes: [{
          id: 'dogfood',
          label: 'DOGFOOD',
          modes: [
            { id: 'dark', label: 'Dark', theme: explicitCtx.theme.theme },
            { id: 'light', label: 'Light', theme: createAlternateShellTheme(explicitCtx) },
          ],
        }],
      });
      let [model] = app.init();
      [model] = app.update(scroll, model);
      const warm = counts.layout;
      [model] = app.update(scroll, model);
      expect(counts.layout).toBe(warm);
      for (const msg of input) {
        [model] = app.update(msg, model);
      }
      expect(model.activePageId).toBe('home');
      const beforeScroll = counts.layout;
      [model] = app.update(scroll, model);
      expect(counts.layout).toBe(beforeScroll + 1);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
