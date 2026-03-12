import { recordDemoGif } from '@flyingrobots/bijou-node';
import { app, ctx } from './main.ts';

export default async function record(): Promise<void> {
  await recordDemoGif({
    name: 'v3-demo',
    app,
    ctx,
    steps: [{ key: ' ' }, { key: ' ' }],
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
  });
}
