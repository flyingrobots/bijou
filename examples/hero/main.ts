import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createHeroApp } from './app.js';
import { createPerfTracker } from './perf.js';
import { nodeMemory } from './perf-node.js';

// Live version of the hero demo: same app the recorder drives, running on real pulses and keys.
const ctx = initDefaultContext();
const perf = createPerfTracker(nodeMemory);
const stdout: { columns?: number; rows?: number } = process.stdout;
const app = createHeroApp({ ctx, perf: perf.sample }, { cols: stdout.columns ?? 120, rows: stdout.rows ?? 36 });
await run({ ...app, view: (model) => perf.measure(() => app.view(model)) });
