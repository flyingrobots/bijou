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
export { CYAN_MAGENTA, TEAL_ORANGE_PINK, PRESETS, tv } from './presets.js';

// Freestanding styled helpers
export { styled, styledStatus } from './styled.js';

// Theme extension
export { extendTheme } from './extend.js';

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

// Color downsampling
export {
  rgbToAnsi256,
  nearestAnsi256,
  rgbToAnsi16,
  ansi256ToAnsi16,
  type ColorLevel,
} from './downsample.js';

// Color manipulation
export {
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mix,
  complementary,
  saturate,
  desaturate,
} from './color.js';
