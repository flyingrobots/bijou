// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The terminal entry: the only file in examples/fun that reaches Node. It reads the font and hands the demos its bytes.
import { readFile } from 'node:fs/promises';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createFunApp as createFramedFunApp } from './fun-app.js';
import { loadDemos } from './registry.js';
import { createFunApp } from './shell.js';

const ctx = initDefaultContext();
// A path from this module, never from the working directory. A missing file shows a message in the font demos.
const font = new URL('../../assets/fonts/space-mono/SpaceMono-BoldItalic.ttf', import.meta.url);
// The shell lists every demo of the catalog, so it loads them all before it starts.
const entries = await loadDemos({ font: () => readFile(font) });
const seed = Date.now() % 1_000_000;
// Mouse mode 'any' reports pointer movement with no button held, which the metaballs follow.
if (process.argv.includes('--app')) {
  // The framed fun app (npm run fun:app), the one the published site runs. --debug halts on shadowed key bindings.
  await createFramedFunApp({ ctx, entries, seed, debug: process.argv.includes('--debug') }).run({ ctx, mouseMode: 'any' });
} else {
  await run(createFunApp({ ctx, entries, seed }), { ctx, mouseMode: 'any' });
}
