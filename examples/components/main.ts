import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createLibraryApp, LIBRARY_CSS } from './library.js';

// Components Library: one component in the middle of the screen. h/l or the arrows move between components,
// [ ] between families, Tab between variants; 1–4 pick the output mode, i shows info, r switches to
// right-to-left layout, / searches component names, F2 opens settings, and q asks before quitting.
const ctx = initDefaultContext();
await run(createLibraryApp(ctx), { ctx, css: LIBRARY_CSS });
