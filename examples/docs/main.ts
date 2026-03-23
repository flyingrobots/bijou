import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createDocsApp } from './app.js';

const ctx = initDefaultContext();
run(createDocsApp(ctx), { ctx, mouse: true });
