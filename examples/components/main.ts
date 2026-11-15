import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { cloneContextWithTheme } from '../../packages/bijou/src/index.js';
import { LIBRARY_USAGE, parseLibraryArgs, resolveStartTheme } from './library-cli.js';
import { createLibraryApp, LIBRARY_CSS } from './library.js';

// Components Library: one component in the middle of the screen. h/l or the arrows move between components,
// [ ] between families, Tab between variants; 1–4 pick the output mode, i shows info, r switches to
// right-to-left layout, / searches component names, F2 opens settings, and q asks before quitting.
const { start, errors } = parseLibraryArgs(process.argv.slice(2));
if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n\n${LIBRARY_USAGE}\n`);
  process.exit(2);
}
const base = initDefaultContext();
// The frame opens on the shell theme that matches the context's theme, so --theme and --scheme set it here.
const theme = start.theme === undefined && start.scheme === undefined ? undefined : resolveStartTheme(start.theme, start.scheme);
const ctx = theme === undefined ? base : cloneContextWithTheme(base, theme);
await run(createLibraryApp(ctx, start), { ctx, css: LIBRARY_CSS });
