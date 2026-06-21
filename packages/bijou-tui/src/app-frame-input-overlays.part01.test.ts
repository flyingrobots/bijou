
import {
  afterAll,
  beforeAll,
  createAlternateShellTheme,
  createFramedApp,
  createSurface,
  createTestContext,
  describe,
  expect,
  it,
  mockClock,
  setDefaultContext,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('uses the run-time ctx as the shell rendering context when shellThemes are configured without an ambient default', async () => {
    const clock = mockClock();
    const explicitCtx = createTestContext({
      mode: 'interactive',
      clock,
      runtime: { columns: 80, rows: 24 },
    });
    const alternateTheme = createAlternateShellTheme(explicitCtx);

    _resetDefaultContextForTesting();
    try {
      const app = createFramedApp({
        pages: [{
          id: 'home',
          title: 'Home',
          init: () => [{ count: 0 }, []],
          update: (msg, model) => [model, []],
          layout: () => ({
            kind: 'pane',
            paneId: 'main',
            render: () => {
              const ctx = explicitCtx;
              const surface = createSurface(8, 1);
              surface.fill({
                char: ' ',
                bg: ctx.surface('primary').bg,
                bgRGB: ctx.surface('primary').bgRGB,
                empty: false,
              });
              surface.set(0, 0, {
                char: 'A',
                fg: ctx.semantic('muted').hex,
                fgRGB: ctx.semantic('muted').fgRGB,
                bg: ctx.surface('primary').bg,
                bgRGB: ctx.surface('primary').bgRGB,
                empty: false,
              });
              return surface;
            },
          }),
        }],
        shellThemes: [
          { id: 'default', label: 'Default', theme: explicitCtx.theme.theme },
          { id: 'alternate', label: 'Alternate', theme: alternateTheme },
        ],
      });

      explicitCtx.io.rawInput = (onKey) => {
        const handles = [
          clock.setTimeout(() => { onKey('\x03'); }, 20),
          clock.setTimeout(() => { onKey('\x03'); }, 30),
        ];
        return {
          dispose() {
            handles.forEach((handle) => {
              handle.dispose();
            });
          },
        };
      };

      const promise = app.run({ ctx: explicitCtx });
      await clock.advanceByAsync(80);
      await promise;

      expect(explicitCtx.io.written.some((chunk) => chunk.includes('Home'))).toBe(true);
    } finally {
      setDefaultContext(testCtx);
    }
  });
});
