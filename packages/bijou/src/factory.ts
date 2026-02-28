import type { BijouContext } from './ports/context.js';
import type { RuntimePort } from './ports/runtime.js';
import type { IOPort } from './ports/io.js';
import type { StylePort } from './ports/style.js';
import type { Theme } from './core/theme/tokens.js';
import type { OutputMode } from './core/detect/tty.js';
import { createResolved, type ResolvedTheme } from './core/theme/resolve.js';
import { CYAN_MAGENTA } from './core/theme/presets.js';
import { PRESETS } from './core/theme/presets.js';
import { fromDTCG, type DTCGDocument } from './core/theme/dtcg.js';
import { detectOutputMode } from './core/detect/tty.js';

/** Options for {@link createBijou}. */
export interface CreateBijouOptions {
  /** Runtime environment adapter. */
  runtime: RuntimePort;
  /** I/O adapter (stdin/stdout, filesystem). */
  io: IOPort;
  /** Style adapter (chalk, plain-text, etc.). */
  style: StylePort;
  /** Explicit theme object. Defaults to {@link CYAN_MAGENTA}. */
  theme?: Theme;
  /** Named preset themes, keyed by name. Defaults to built-in {@link PRESETS}. */
  presets?: Record<string, Theme>;
  /** Environment variable that selects a preset or JSON path. Defaults to `"BIJOU_THEME"`. */
  envVar?: string;
}

/**
 * Create a fully-wired {@link BijouContext} from adapter ports.
 *
 * Theme resolution order:
 * 1. If the env-var points to a `.json` file, load and parse it as a DTCG document.
 * 2. Otherwise look the env-var value up in `presets`.
 * 3. Fall back to the explicit `theme` option (or the built-in default).
 *
 * @param options - Adapter ports and optional theme overrides.
 * @returns A frozen context ready to pass to any bijou component.
 */
export function createBijou(options: CreateBijouOptions): BijouContext {
  const { runtime, io, style } = options;
  const envVar = options.envVar ?? 'BIJOU_THEME';
  const presets = options.presets ?? PRESETS;
  const fallback = options.theme ?? CYAN_MAGENTA;

  const noColor = runtime.env('NO_COLOR') !== undefined;
  const themeValue = runtime.env(envVar);

  let themeObj: Theme = fallback;

  if (themeValue) {
    if (themeValue.endsWith('.json')) {
      try {
        const content = io.readFile(themeValue);
        const doc = JSON.parse(content) as DTCGDocument;
        themeObj = fromDTCG(doc);
      } catch (err) {
        // Fallback if file read/parse fails
      }
    } else {
      themeObj = presets[themeValue] ?? fallback;
    }
  }

  const theme: ResolvedTheme = createResolved(themeObj, noColor);
  const mode: OutputMode = detectOutputMode(runtime);

  return { theme, mode, runtime, io, style };
}
