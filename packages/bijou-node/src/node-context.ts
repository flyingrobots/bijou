import type { BijouContext } from '@flyingrobots/bijou';
import { createBijou } from '@flyingrobots/bijou';
import type { CreateNodeContextOptions } from './options.js';
import { nodeIO } from './io.js';
import { resolveNodeThemeSelection } from './node-context-selection.js';
import { nodeRuntime } from './runtime.js';
import { chalkStyle } from './style.js';

/**
 * Create a {@link BijouContext} wired to Node.js adapters.
 *
 * Assembles the Node runtime, I/O, and style adapters into one context. The
 * style adapter honors `NO_COLOR`; theme selection remains explicit and
 * deterministic through the supplied options and environment.
 *
 * @param options - Node I/O and theme-selection options.
 * @returns A fresh {@link BijouContext} backed by the current Node.js process.
 */
export function createNodeContext(
  options: CreateNodeContextOptions = {},
): BijouContext {
  const runtime = nodeRuntime();
  const noColor = runtime.env('NO_COLOR') !== undefined;
  const selection = resolveNodeThemeSelection(runtime, options);
  return createBijou({
    runtime,
    io: options.io ?? nodeIO(options.nodeIO),
    style: chalkStyle({ noColor, level: noColor ? 0 : 3 }),
    theme: selection.fallbackTheme,
    presets: selection.presets,
    envVar: selection.envVar,
    colorScheme: selection.colorScheme,
  });
}
