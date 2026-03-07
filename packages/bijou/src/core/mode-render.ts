import type { OutputMode } from './detect/tty.js';

/**
 * A renderer function for a specific output mode.
 *
 * @template I - Input options type.
 * @template O - Output type (usually `string`).
 */
export type ModeHandler<I, O> = (options: I) => O;

/**
 * A map of renderers for each supported output mode.
 *
 * @template I - Input options type.
 * @template O - Output type.
 */
export type ModeMap<I, O> = {
  readonly [K in OutputMode]?: ModeHandler<I, O>;
};

/**
 * Dispatch rendering to a mode-specific handler.
 *
 * If no handler is defined for the requested mode, it falls back to a
 * sibling in the same visual group first: visual modes (`interactive`,
 * `static`) fall back to each other, then to `pipe` → `accessible`;
 * non-visual modes (`pipe`, `accessible`) fall back to each other, then
 * to `interactive` → `static`. Finally falls back to the first available
 * handler in the map.
 *
 * @template I - Input options type.
 * @template O - Output type.
 * @param mode - The current output mode to dispatch for.
 * @param map - Map of mode-specific renderer handlers.
 * @param options - Options to pass to the selected handler.
 * @returns The output from the selected handler.
 * @throws {Error} If the map is empty.
 */
export function renderByMode<I, O>(
  mode: OutputMode,
  map: ModeMap<I, O>,
  options: I,
): O {
  // 1. Direct match
  const direct = map[mode];
  if (direct) return direct(options);

  // 2. Fallback chain
  // - visual modes (interactive, static) fall back to each other first.
  // - fallback modes (pipe, accessible) fall back to each other first.
  const visual = mode === 'interactive' || mode === 'static';
  const fallbacks: OutputMode[] = visual
    ? ['interactive', 'static', 'pipe', 'accessible']
    : ['pipe', 'accessible', 'interactive', 'static'];

  for (const f of fallbacks) {
    const handler = map[f];
    if (handler) return handler(options);
  }

  // 3. First available
  const first = Object.values(map)[0];
  if (first) return (first as ModeHandler<I, O>)(options);

  throw new Error(`renderByMode: no handlers defined in map for mode "${mode}"`);
}
