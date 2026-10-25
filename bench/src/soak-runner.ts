import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createSoakApp } from './soak-app.js';

const ctx = initDefaultContext();
await run(createSoakApp(ctx), { ctx });
