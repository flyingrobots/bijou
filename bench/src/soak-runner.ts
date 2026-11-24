import '../../scripts/docker-seal/require-docker.mjs';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createSoakApp } from './soak-app.js';
import { createNodeSoakHost } from './soak-node.js';

const ctx = initDefaultContext();
await run(createSoakApp(ctx, createNodeSoakHost(process.argv.slice(2))), { ctx });
