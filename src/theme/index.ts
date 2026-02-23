// Token types
export type {
  RGB,
  GradientStop,
  TextModifier,
  TokenValue,
  InkColor,
  BaseStatusKey,
  Theme,
} from './tokens.js';

// Presets
export { CYAN_MAGENTA, TEAL_ORANGE_PINK, PRESETS } from './presets.js';

// Gradient
export { lerp3, gradientText } from './gradient.js';

// Resolver
export {
  isNoColor,
  getTheme,
  resolveTheme,
  _resetThemeForTesting,
  createThemeResolver,
} from './resolve.js';
export type { ResolvedTheme, ThemeResolver, ThemeResolverOptions } from './resolve.js';

// Chalk adapter
export { chalkFromToken, styled, styledStatus } from './chalk-adapter.js';
