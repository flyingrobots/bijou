import { recordDemoGif } from '@flyingrobots/bijou-node';
import { app, ctx, css } from './main.ts';

export default async function record(): Promise<void> {
  await recordDemoGif({
    name: 'v3-css',
    app,
    ctx,
    css,
    steps: [
      { resize: { columns: 72, rows: 18 } },
      { resize: { columns: 96, rows: 18 } },
    ],
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
    frameDelayMs: 140,
  });
}
