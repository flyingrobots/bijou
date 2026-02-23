// Token types
export type {
  RGB,
  GradientStop,
  TextModifier,
  TokenValue,
  InkColor,
  BaseStatusKey,
  BaseUiKey,
  BaseGradientKey,
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
  createResolved,
} from './resolve.js';
export type { ResolvedTheme, ThemeResolver, ThemeResolverOptions } from './resolve.js';


// Gradient options
export type { GradientTextOptions } from './gradient.js';

// DTCG interop
export { fromDTCG, toDTCG } from './dtcg.js';
export type { DTCGDocument, DTCGToken, DTCGGroup } from './dtcg.js';
