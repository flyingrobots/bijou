import type { Theme, TokenValue, GradientStop, BaseStatusKey, BaseUiKey, BaseGradientKey } from './tokens.js';

/**
 * Extend a base theme with additional status, UI, or gradient tokens.
 *
 * Merges the extension records into the base theme's corresponding groups,
 * preserving all existing keys and adding new ones.
 *
 * @template S - Additional status keys beyond BaseStatusKey.
 * @template U - Additional UI element keys beyond BaseUiKey.
 * @template G - Additional gradient keys beyond BaseGradientKey.
 * @param base - Base theme to extend.
 * @param extensions - Partial records of additional tokens to merge.
 * @returns New Theme with the union of base and extension keys.
 */
export function extendTheme<
  S extends string = never,
  U extends string = never,
  G extends string = never,
>(base: Theme, extensions: {
  status?: Partial<Record<S, TokenValue>>;
  ui?: Partial<Record<U, TokenValue>>;
  gradient?: Partial<Record<G, GradientStop[]>>;
}): Theme<BaseStatusKey | S, BaseUiKey | U, BaseGradientKey | G> {
  return {
    ...base,
    status: { ...base.status, ...extensions.status } as Record<BaseStatusKey | S, TokenValue>,
    ui: { ...base.ui, ...extensions.ui } as Record<BaseUiKey | U, TokenValue>,
    gradient: { ...base.gradient, ...extensions.gradient } as Record<BaseGradientKey | G, GradientStop[]>,
  };
}
