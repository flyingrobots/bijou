
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  mockClock,
  runScript,
  setDefaultContext,
  _resetDefaultContextForTesting,
  PageTransition,
} from './app-frame.test-support.js';

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('runs transition animation through runScript', async () => {
    const clock = mockClock();
    const ctx = createTestContext({ clock });
    const app = createFramedApp({
      pages: [
        makePage('p1', 'P1', 'm'),
        makePage('p2', 'P2', 'm'),
      ],
      transition: 'fade',
      transitionDuration: 20,
    });

    const promise = runScript(app, [
      { key: ']' },
    ], { ctx });
    await clock.advanceByAsync(200);
    const result = await promise;

    expect(result.model.activePageId).toBe('p2');
    expect(result.model.previousPageId).toBeUndefined();
    expect(result.model.transitionProgress).toBe(1);
    // Transition emits frames, so we expect more than just the keypress frame
    expect(result.frames.length).toBeGreaterThan(1);
  });
});

describe('createFramedApp', () => {
const testCtx = createTestContext();

beforeAll(() => { setDefaultContext(testCtx); });

afterAll(() => { _resetDefaultContextForTesting(); });

it('renders complex transition styles (melt, matrix, scramble) without error', async () => {
    const transitions: PageTransition[] = ['melt', 'matrix', 'scramble'];
    
    for (const transition of transitions) {
      const clock = mockClock();
      const ctx = createTestContext({ clock });
      const app = createFramedApp({
        pages: [
          makePage('p1', 'P1', 'm'),
          makePage('p2', 'P2', 'm'),
        ],
        transition,
        transitionDuration: 10,
      });

      const promise = runScript(app, [
        { key: ']' },
      ], { ctx });
      await clock.advanceByAsync(100);
      const result = await promise;

      expect(result.model.activePageId).toBe('p2');
      expect(result.model.transitionProgress).toBe(1);
    }
  });
});
