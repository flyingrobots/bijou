import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createDocsApp } from './app.js';

const ctx = initDefaultContext();
await run(createDocsApp(ctx), { ctx, mouse: true });
