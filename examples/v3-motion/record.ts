import { recordDemoGif } from '@flyingrobots/bijou-node';
import { app, ctx } from './main.ts';

export default async function record(): Promise<void> {
  const pulses = Array.from({ length: 10 }, () => ({ pulse: { dt: 1 / 30 } })) as const;

  await recordDemoGif({
    name: 'v3-motion',
    app,
    ctx,
    steps: [
      { key: '\x1b[C' },
      ...pulses,
      { key: '\x1b[B' },
      ...pulses,
    ],
    outputPath: new URL('./demo.gif', import.meta.url).pathname,
    frameDelayMs: 70,
  });
}
