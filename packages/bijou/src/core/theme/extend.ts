import type { Theme, TokenValue, GradientStop, BaseStatusKey, BaseUiKey, BaseGradientKey } from './tokens.js';

/**
 * Extend a base theme, overriding or adding tokens in any of its six groups.
 *
 * Merges the extension records into the base theme's corresponding groups,
 * preserving all existing keys and adding new ones.
 *
 * `border` and `semantic` are overridable but not extensible with new keys —
 * unlike `status`, `ui` and `gradient`, their key sets are fixed by `Theme`.
 * They are reachable here because the shipped presets alias heavily across
 * groups: `bijou-dark` uses one amber for ten tokens spanning `status`,
 * `semantic`, `ui` and `border`, so an app that could only replace `status` kept
 * that amber for every heading, cursor and border without being told.
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
  surface?: Partial<Theme['surface']>;
  border?: Partial<Theme['border']>;
  semantic?: Partial<Theme['semantic']>;
}): Theme<BaseStatusKey | S, BaseUiKey | U, BaseGradientKey | G> {
  return {
    ...base,
    status: mergeRecord(base.status, extensions.status),
    ui: mergeRecord(base.ui, extensions.ui),
    gradient: mergeRecord(base.gradient, extensions.gradient),
    surface: { ...base.surface, ...extensions.surface },
    border: { ...base.border, ...extensions.border },
    semantic: { ...base.semantic, ...extensions.semantic },
  };
}

function mergeRecord<V>(
  base: Readonly<Record<string, V>>,
  extension: Readonly<Partial<Record<string, V>>> | undefined,
): Record<string, V> {
  const merged: Record<string, V> = { ...base };
  if (extension === undefined) return merged;
  for (const key of Object.keys(extension)) {
    const value = extension[key];
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}
