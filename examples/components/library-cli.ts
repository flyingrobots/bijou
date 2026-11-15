import type { OutputMode, Theme } from '../../packages/bijou/src/index.js';
import type { FrameShellThemeSpec } from '../../packages/bijou-tui/src/index.js';
import { DOGFOOD_SHELL_THEMES } from '../docs/dogfood-shell-themes.js';
import { COMPONENT_STORIES } from '../docs/stories.js';

/** Where the Components Library opens, from `npm run components -- [options]`. */
export interface LibraryStart {
  readonly component?: string;
  readonly variant?: string;
  readonly mode?: OutputMode;
  readonly info?: boolean;
  readonly rtl?: boolean;
  readonly slide?: 'title' | 'family' | 'component';
  readonly theme?: string;
  readonly scheme?: 'dark' | 'light';
}

export const LIBRARY_USAGE = `Usage: npm run components -- [options]

  --component <name>   open on a component: its story id or function name, for example alert or table
  --variant <name>     open on a variant: its id or label, for example warning
  --mode <mode>        output mode: interactive, static, pipe, or accessible
  --info               open with info shown
  --rtl                open in right-to-left layout
  --slide <slide>      title, family, or component (default: component when --component is given, else title)
  --theme <id>         shell theme family: ${DOGFOOD_SHELL_THEMES.map((t) => t.id).join(', ')}
  --scheme <scheme>    dark or light`;

const MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
const FLAGS = new Set(['info', 'rtl']);

/** Parse `--name value`, `--name=value`, and the boolean flags `--info` and `--rtl`. */
export function parseLibraryArgs(argv: readonly string[]): { start: LibraryStart; errors: string[] } {
  const values = new Map<string, string>();
  const errors: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    if (!arg.startsWith('--')) { errors.push(`Unexpected argument "${arg}".`); continue; }
    const [name = '', inline] = arg.slice(2).split(/=(.*)/s);
    if (FLAGS.has(name)) { values.set(name, 'true'); continue; }
    const value = inline ?? argv[++i];
    if (value === undefined) errors.push(`--${name} needs a value.`);
    else values.set(name, value);
  }
  const start = toStart(values, errors);
  return { start, errors };
}

function oneOf<T extends string>(name: string, value: string | undefined, allowed: readonly T[], errors: string[]): T | undefined {
  if (value === undefined) return undefined;
  const match = allowed.find((option) => option === value);
  if (match === undefined) errors.push(`--${name} must be one of: ${allowed.join(', ')}.`);
  return match;
}

function toStart(values: ReadonlyMap<string, string>, errors: string[]): LibraryStart {
  const known = new Set(['component', 'variant', 'mode', 'info', 'rtl', 'slide', 'theme', 'scheme']);
  for (const name of values.keys()) if (!known.has(name)) errors.push(`Unknown option --${name}.`);
  const component = values.get('component');
  if (component !== undefined && findStoryIndex(component) < 0) errors.push(`No component named "${component}".`);
  const theme = values.get('theme');
  if (theme !== undefined && !DOGFOOD_SHELL_THEMES.some((t) => t.id === theme)) errors.push(`No shell theme named "${theme}".`);
  // Optional fields are set only when given, as the strict optional-property typing requires.
  const start: { -readonly [K in keyof LibraryStart]: LibraryStart[K] } = { info: values.has('info'), rtl: values.has('rtl') };
  const variant = values.get('variant');
  const mode = oneOf('mode', values.get('mode'), MODES, errors);
  const slide = oneOf('slide', values.get('slide'), ['title', 'family', 'component'] as const, errors);
  const scheme = oneOf('scheme', values.get('scheme'), ['dark', 'light'] as const, errors);
  if (component !== undefined) start.component = component;
  if (variant !== undefined) start.variant = variant;
  if (mode !== undefined) start.mode = mode;
  if (slide !== undefined) start.slide = slide;
  if (theme !== undefined) start.theme = theme;
  if (scheme !== undefined) start.scheme = scheme;
  return start;
}

/** A story by id or by one of the function names in its title, for example `table` for `table() / navigableTableSurface()`. */
export function findStoryIndex(name: string): number {
  const wanted = name.replace(/\(\)$/, '').toLowerCase();
  return COMPONENT_STORIES.findIndex((story) => story.id.toLowerCase() === wanted
    || story.title.split('/').some((part) => part.trim().replace(/\(\)$/, '').toLowerCase() === wanted));
}

/** The theme for a shell theme family and scheme; a single-theme family ignores the scheme. */
export function resolveStartTheme(id: string | undefined, scheme: 'dark' | 'light' = 'dark'): Theme | undefined {
  const spec: FrameShellThemeSpec | undefined = DOGFOOD_SHELL_THEMES.find((t) => t.id === (id ?? DOGFOOD_SHELL_THEMES[0]?.id));
  if (spec === undefined) return undefined;
  if (spec.modes === undefined) return spec.theme;
  return (spec.modes.find((m) => m.id === scheme) ?? spec.modes[0])?.theme;
}
