import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { runNodeDocsApp } from './node-app.js';
import { DOGFOOD_TERMINAL_NOTICE, dogfoodTerminalReadiness } from './terminal-guard.js';

const ctx = initDefaultContext();
const readiness = dogfoodTerminalReadiness(ctx);
if (!readiness.ok) {
  process.stderr.write(readiness.message);
  process.exit(1);
}
process.stderr.write(DOGFOOD_TERMINAL_NOTICE);
await runNodeDocsApp(ctx, undefined, { ctx, mouse: true });
