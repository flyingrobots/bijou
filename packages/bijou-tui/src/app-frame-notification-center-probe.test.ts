import { vi } from 'vitest';
import {
  afterAll,
  beforeAll,
  createFramedApp,
  createTestContext,
  describe,
  expect,
  it,
  makePage,
  setDefaultContext,
  shiftKey,
  _resetDefaultContextForTesting,
} from './app-frame.test-support.js';

describe('createFramedApp notification-center availability', () => {
  const testCtx = createTestContext();
  beforeAll(() => { setDefaultContext(testCtx); });
  afterAll(() => { _resetDefaultContextForTesting(); });

  it('does not probe a custom provider when runtime notifications are enabled', () => {
    const notificationCenter = vi.fn(() => undefined);
    const app = createFramedApp({
      pages: [makePage('home', 'Home', 'main')],
      notificationCenter,
    });

    let [model] = app.init();
    [model] = app.update(shiftKey('n'), model);

    expect(model.notificationCenterOpen).toBe(true);
    expect(notificationCenter).not.toHaveBeenCalled();
  });
});
