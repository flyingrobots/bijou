import { recordDemoGif } from '@flyingrobots/bijou-node';
import { app, ctx } from './main.ts';

export default async function record(): Promise<void> {
  await recordDemoGif({
    name: 'v3-subapp',
    app,
    ctx,
    steps: [{ key: 'a' }, { key: 'k' }, { key: 'm' }],
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
  });
}
