import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createNodeDocsApp } from './node-app.js';

const ctx = initDefaultContext();
if (!ctx.runtime.stdoutIsTTY) {
  process.stderr.write('DOGFOOD requires an interactive terminal. Run this command in a terminal emulator, not a shell pipeline.\n');
  process.exit(1);
}
await run(createNodeDocsApp(ctx), { ctx, mouse: true });
