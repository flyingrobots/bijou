import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { setDefaultContext } from '@flyingrobots/bijou';
import { recordDemoGif } from '@flyingrobots/bijou-node';
import { app } from './main.ts';

export default async function record(): Promise<void> {
  const ctx = createTestContext({
    runtime: { columns: 88, rows: 18 },
  });
  setDefaultContext(ctx);

  await recordDemoGif({
    name: 'v3-worker',
    app,
    ctx,
    steps: [
      { msg: { type: 'host-note', text: 'Main thread says hello via the data channel.' } },
      { key: ' ' },
    ],
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
    frameDelayMs: 120,
  });
}
