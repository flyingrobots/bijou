import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createNodeDocsApp } from './node-app.js';

const ctx = initDefaultContext();
await run(createNodeDocsApp(ctx), { ctx, mouse: true });
