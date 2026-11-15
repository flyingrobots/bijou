import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createZenApp } from './zen.js';

// Zen: one component in the middle of the screen. h/j/k/l or arrows walk, 1–4 switch lowering,
// / searches component names, Tab cycles variants, F2 opens settings, q asks before quitting.
const ctx = initDefaultContext();
await run(createZenApp(ctx), { ctx });
