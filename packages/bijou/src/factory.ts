import type { BijouContext } from './ports/context.js';
import type { RuntimePort } from './ports/runtime.js';
import type { IOPort } from './ports/io.js';
import type { StylePort } from './ports/style.js';
import type { Theme } from './core/theme/tokens.js';
import type { OutputMode } from './core/detect/tty.js';
import { createResolved, type ResolvedTheme } from './core/theme/resolve.js';
import { CYAN_MAGENTA } from './core/theme/presets.js';
import { PRESETS } from './core/theme/presets.js';
import { detectOutputMode } from './core/detect/tty.js';

export interface CreateBijouOptions {
  runtime: RuntimePort;
  io: IOPort;
  style: StylePort;
  theme?: Theme;
  presets?: Record<string, Theme>;
  envVar?: string;
}

export function createBijou(options: CreateBijouOptions): BijouContext {
  const { runtime, io, style } = options;
  const envVar = options.envVar ?? 'BIJOU_THEME';
  const presets = options.presets ?? PRESETS;
  const fallback = options.theme ?? CYAN_MAGENTA;

  const noColor = runtime.env('NO_COLOR') !== undefined;
  const themeName = runtime.env(envVar) ?? fallback.name;
  const themeObj = presets[themeName] ?? fallback;
  const theme: ResolvedTheme = createResolved(themeObj, noColor);
  const mode: OutputMode = detectOutputMode(runtime);

  return { theme, mode, runtime, io, style };
}
