import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createShowcaseApp } from './app.js';

const ctx = initDefaultContext();
const app = createShowcaseApp(ctx);
run(app);
