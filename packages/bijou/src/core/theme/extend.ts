import type { Theme, TokenValue, GradientStop, BaseStatusKey, BaseUiKey, BaseGradientKey } from './tokens.js';

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
