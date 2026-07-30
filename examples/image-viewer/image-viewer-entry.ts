import type { BijouContext } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createImageViewerApp } from './image-viewer-create.js';

export async function main(
  ctx: BijouContext = initDefaultContext(),
): Promise<void> {
  await run(createImageViewerApp(ctx, { initialPath: process.argv[2] }), {
    ctx,
  });
}
