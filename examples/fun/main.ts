// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The terminal entry: the only file in examples/fun that reaches Node.
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { demos } from './registry.js';
import { createFunApp } from './shell.js';

const ctx = initDefaultContext();
// Mouse mode 'any' reports pointer movement with no button held, which the metaballs follow.
await run(createFunApp({ ctx, entries: demos, seed: Date.now() % 1_000_000 }), { ctx, mouseMode: 'any' });
