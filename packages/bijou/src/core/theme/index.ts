/**
 * Theme module barrel — re-exports all theme types, presets, utilities,
 * gradient helpers, resolver, DTCG interop, color downsampling, and
 * color manipulation functions.
 *
 * @module
 */

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
// Theme accessors
export { createThemeAccessors, type ThemeAccessors } from './accessors.js';

// Reactive Token Graph
export { createTokenGraph } from './graph.js';
export type { TokenGraph, ThemeMode } from './graph.js';
export type {
  ColorDefinition,
  TokenDefinition,
  TokenDefinitions,
  ColorTransform,
} from './graph-types.js';

// Color manipulation
export {
  color,
  colorHex,
  colorRgb,
  hexToRgb,
  isResolvedColor,
  resolveColor,
  rgbToHex,
  tryResolveColor,
  lighten,
  darken,
  mix,
  complementary,
  saturate,
  desaturate,
} from './color.js';
export type { ColorRef, ResolvedColor } from './color.js';
