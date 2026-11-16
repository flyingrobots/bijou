import { createTestContext } from '../../packages/bijou/src/adapters/test/index.js';
import { cloneContextWithTheme, type BijouContext, type OutputMode, type Surface } from '../../packages/bijou/src/index.js';
import { chalkStyle } from '../../packages/bijou-node/src/index.js';
import { createStoryProfileContext, storyPreviewSurface } from '../../examples/_stories/protocol.js';
import type { COMPONENT_STORIES } from '../../examples/docs/stories.js';
import { resolveStartTheme } from '../../examples/components/library-cli.js';
import { DOGFOOD_SHELL_THEMES } from '../../examples/docs/dogfood-shell-themes.js';

/** One audited combination: a component's variant in one output mode and one theme. */
export interface Combo {
  readonly story: (typeof COMPONENT_STORIES)[number];
  readonly variantIndex: number;
  readonly mode: OutputMode;
  readonly theme: string;
  readonly scheme: 'dark' | 'light';
}

export interface Rendered {
  readonly combo: Combo;
  readonly ctx: BijouContext;
  /** The story's own output when it returns a string, before it becomes cells. */
  readonly raw?: string;
  readonly surface?: Surface;
  readonly error?: string;
}

export const MODES: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
export const WIDTH = 72;

/** The shell theme families and their schemes; a single-scheme family is audited once, as dark. */
export const THEMES: readonly { readonly theme: string; readonly scheme: 'dark' | 'light' }[] = DOGFOOD_SHELL_THEMES.flatMap((spec) =>
  spec.modes === undefined ? [{ theme: spec.id, scheme: 'dark' as const }]
    : spec.modes.map((m) => ({ theme: spec.id, scheme: m.id === 'light' ? 'light' as const : 'dark' as const })));

/**
 * The context a real terminal gives each mode: colour for interactive and static, and no styling for pipe and
 * accessible output, which a terminal writes without colour when it is not a TTY or a reader asks for plain text.
 */
function contextFor(combo: Combo): BijouContext {
  const styled = combo.mode === 'interactive' || combo.mode === 'static';
  const base = createTestContext({ mode: combo.mode, ...(styled ? { style: chalkStyle({ level: 3 }) } : {}), runtime: { columns: WIDTH, rows: 40 } });
  const theme = resolveStartTheme(combo.theme, combo.scheme);
  return theme === undefined ? base : cloneContextWithTheme(base, theme);
}

export function renderCombo(combo: Combo): Rendered {
  const ctx = contextFor(combo);
  const variant = combo.story.variants[combo.variantIndex];
  if (variant === undefined) return { combo, ctx, error: `no variant ${String(combo.variantIndex)}` };
  try {
    const previewCtx = createStoryProfileContext(ctx, { id: combo.mode, label: combo.mode, mode: combo.mode, width: WIDTH }, { width: WIDTH, height: 40 });
    // Static is one honest frame, so its clock stands still.
    const preview = variant.render({ width: WIDTH, ctx: previewCtx, state: variant.initialState, timeMs: 0 });
    return { combo, ctx, ...(typeof preview === 'string' ? { raw: preview } : {}), surface: storyPreviewSurface(preview) };
  } catch (error) {
    return { combo, ctx, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Every combination: each variant in interactive and static under every theme, and in pipe and accessible once. */
export function allCombos(stories: readonly Combo['story'][]): Combo[] {
  return stories.flatMap((story) => story.variants.flatMap((_, variantIndex) => MODES.flatMap((mode) =>
    (mode === 'interactive' || mode === 'static' ? THEMES : THEMES.slice(0, 1))
      .map(({ theme, scheme }) => ({ story, variantIndex, mode, theme, scheme })))));
}
