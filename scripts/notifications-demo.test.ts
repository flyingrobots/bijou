import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { setDefaultContext, surfaceToString } from '@flyingrobots/bijou';
import { runScript } from '@flyingrobots/bijou-tui';
import { createNotificationDemoApp } from '../examples/notifications/main.js';

describe('notifications demo', () => {
  const testCtx = createTestContext({
    noColor: true,
    runtime: { columns: 80, rows: 24 },
  });

  beforeAll(() => setDefaultContext(testCtx));
  afterAll(() => _resetDefaultContextForTesting());

  it('blocks background notification shortcuts while the history center is open', async () => {
    const app = createNotificationDemoApp(testCtx, { autoDemo: false });
    const result = await runScript(app, [
      { key: 'n' },
      { key: 'H' },
      { key: 'n' },
      { key: 'q' },
    ], { ctx: testCtx });

    const pageModel = result.model.pageModels.notifications!;
    expect(pageModel.nextOrdinal).toBe(2);
    expect(pageModel.notifications.items).toHaveLength(1);
    expect(pageModel.historyOpen).toBe(false);
  });

  it('clamps the history center to compact terminals', async () => {
    const compactCtx = createTestContext({
      noColor: true,
      runtime: { columns: 40, rows: 12 },
    });
    setDefaultContext(compactCtx);

    const app = createNotificationDemoApp(compactCtx, { autoDemo: false });
    const result = await runScript(app, [{ key: 'H' }], {
      ctx: compactCtx,
      pulseFps: false,
    });

    const rendered = surfaceToString(result.frames.at(-1)!, compactCtx.style);
    expect(rendered).toContain('History');
    expect(rendered).toContain('PgUp/PgDn');
    expect(rendered).toContain('No archived notifications');
  });
});
