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

export {
  defineTheme,
  isTokenRef,
  resolveThemeColorRef,
  tokenRef,
} from './builder.js';
export type {
  ResolveThemeColorRefOptions,
  ThemeBuilder,
  ThemeBuilderModeId,
  ThemeBuilderRequiredMode,
  ThemeColorInput,
  ThemeColorRef,
  ThemeColorResolution,
  ThemeColorTokenValue,
  ThemeModeBuilder,
  ThemeModeTokenColorBuilder,
  ThemeModeTokenDraftBuilder,
  ThemeModeTokenIdBuilder,
  ThemeModeTokenRegistrationBuilder,
  ThemeRgbObject,
  ThemeTokenRef,
  TokenTheme,
  TokenThemeMode,
} from './builder.js';

export { BIJOU_DARK, BIJOU_LIGHT, CYAN_MAGENTA, TEAL_ORANGE_PINK, PRESETS, tv } from './presets.js';

export * from './styled.js';

export { extendTheme } from './extend.js';

export { defineThemeSafePairs, doctorTheme, themeContrastRatio } from './doctor.js';
export type {
  ThemeContrastPair,
  ThemeDoctorIssue,
  ThemeDoctorIssueKind,
  ThemeDoctorOptions,
  ThemeDoctorReport,
  ThemeDoctorSeverity,
  ThemeSafePair,
  ThemeSafePairBuilder,
  ThemeSafePairKind,
  ThemeSafePairOptions,
} from './doctor.js';

export { lerp3, gradientText } from './gradient.js';

export {
  isNoColor,
  createThemeResolver,
  createResolved,
} from './resolve.js';
export type { ResolvedTheme, ThemeResolver, ThemeResolverOptions } from './resolve.js';
export type { GradientTextOptions } from './gradient.js';

export { fromDTCG, toDTCG } from './dtcg.js';
export type { DTCGDocument, DTCGToken, DTCGGroup } from './dtcg.js';

export {
  rgbToAnsi256,
  nearestAnsi256,
  rgbToAnsi16,
  ansi256ToAnsi16,
  type ColorLevel,
} from './downsample.js';
export { createThemeAccessors, type ThemeAccessors } from './accessors.js';

export { createTokenGraph } from './graph.js';
export type { TokenGraph, ThemeMode } from './graph.js';
export {
  bestContrastWith,
  closestColor,
  colorCandidate,
  isThemeColorRuleDefinition,
  leastVivid,
  minContrastWith,
  mostVivid,
  nthColor,
  scope,
  tokenCandidate,
} from './theme-rules.js';
export type { MinContrastRuleOptions, VividRuleOptions } from './theme-rules.js';
export type {
  ColorDefinition,
  TokenDefinition,
  TokenDefinitions,
  ColorTransform,
  ThemeColorRuleDefinition,
  ThemeRuleCandidateInput,
  ThemeRuleCandidateInspection,
  ThemeRuleCandidateReason,
  ThemeRuleCandidateScope,
  ThemeRuleCandidateSource,
  ThemeRuleCandidatePath,
  ThemeRuleCandidateValue,
  ThemeRuleInspection,
  ThemeTokenInspection,
  TokenGraphInspection,
} from './graph-types.js';

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
