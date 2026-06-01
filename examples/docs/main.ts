import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createNodeDocsApp } from './node-app.js';
import { DOGFOOD_TERMINAL_NOTICE, dogfoodTerminalReadiness } from './terminal-guard.js';

const ctx = initDefaultContext();
const readiness = dogfoodTerminalReadiness(ctx);
if (!readiness.ok) {
  process.stderr.write(readiness.message);
  process.exit(1);
}
process.stderr.write(DOGFOOD_TERMINAL_NOTICE);
await run(createNodeDocsApp(ctx), { ctx, mouse: true });
