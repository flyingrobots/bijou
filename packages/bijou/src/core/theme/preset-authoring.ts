import { hexToRgb } from './color.js';
import { createTokenGraph, type ThemeMode, type TokenGraph } from './graph.js';
import type { ColorDefinition, TokenDefinitions } from './graph-types.js';
import type {
  GradientStop,
  RGB,
  Theme,
  TokenValue,
} from './tokens.js';

interface RuleAuthoredPresetOptions {
  readonly name: string;
  readonly mode: ThemeMode;
  readonly definitions: TokenDefinitions;
  readonly gradient: {
    readonly brand: readonly ColorDefinition[];
    readonly progress: readonly ColorDefinition[];
  };
}

const RULE_AUTHORED_DEFINITIONS = new WeakMap<Theme, TokenDefinitions>();

export function compileRuleAuthoredPreset(options: RuleAuthoredPresetOptions): Theme {
  const graph = createTokenGraph(options.definitions);
  const theme: Theme = {
    name: options.name,
    status: {
      success: readToken(graph, options.mode, 'status.success'),
      error: readToken(graph, options.mode, 'status.error'),
      warning: readToken(graph, options.mode, 'status.warning'),
      info: readToken(graph, options.mode, 'status.info'),
      pending: readToken(graph, options.mode, 'status.pending'),
      active: readToken(graph, options.mode, 'status.active'),
      muted: readToken(graph, options.mode, 'status.muted'),
    },
    semantic: {
      success: readToken(graph, options.mode, 'semantic.success'),
      error: readToken(graph, options.mode, 'semantic.error'),
      warning: readToken(graph, options.mode, 'semantic.warning'),
      info: readToken(graph, options.mode, 'semantic.info'),
      accent: readToken(graph, options.mode, 'semantic.accent'),
      muted: readToken(graph, options.mode, 'semantic.muted'),
      primary: readToken(graph, options.mode, 'semantic.primary'),
    },
    gradient: readGradients(graph, options.mode, options.gradient),
    border: {
      primary: readToken(graph, options.mode, 'border.primary'),
      secondary: readToken(graph, options.mode, 'border.secondary'),
      success: readToken(graph, options.mode, 'border.success'),
      warning: readToken(graph, options.mode, 'border.warning'),
      error: readToken(graph, options.mode, 'border.error'),
      muted: readToken(graph, options.mode, 'border.muted'),
    },
    ui: {
      cursor: readToken(graph, options.mode, 'ui.cursor'),
      focusGutter: readToken(graph, options.mode, 'ui.focusGutter'),
      scrollThumb: readToken(graph, options.mode, 'ui.scrollThumb'),
      scrollTrack: readToken(graph, options.mode, 'ui.scrollTrack'),
      sectionHeader: readToken(graph, options.mode, 'ui.sectionHeader'),
      logo: readToken(graph, options.mode, 'ui.logo'),
      tableHeader: readToken(graph, options.mode, 'ui.tableHeader'),
      trackEmpty: readToken(graph, options.mode, 'ui.trackEmpty'),
    },
    surface: {
      primary: readToken(graph, options.mode, 'surface.primary'),
      secondary: readToken(graph, options.mode, 'surface.secondary'),
      elevated: readToken(graph, options.mode, 'surface.elevated'),
      overlay: readToken(graph, options.mode, 'surface.overlay'),
      muted: readToken(graph, options.mode, 'surface.muted'),
    },
  };
  RULE_AUTHORED_DEFINITIONS.set(theme, options.definitions);
  return theme;
}

export function ruleAuthoredDefinitions(theme: Theme): TokenDefinitions | undefined {
  return RULE_AUTHORED_DEFINITIONS.get(theme);
}

function readToken(graph: TokenGraph, mode: ThemeMode, path: string): TokenValue {
  return cloneToken(graph.get(path, mode));
}

function readGradients(
  graph: TokenGraph,
  mode: ThemeMode,
  definitions: RuleAuthoredPresetOptions['gradient'],
): Theme['gradient'] {
  return {
    brand: gradient(graph, mode, definitions.brand),
    progress: gradient(graph, mode, definitions.progress),
  };
}

function gradient(
  graph: TokenGraph,
  mode: ThemeMode,
  definitions: readonly ColorDefinition[],
): GradientStop[] {
  const max = Math.max(1, definitions.length - 1);
  return definitions.map((definition, index) => ({
    pos: index / max,
    color: hexToRgb(graph.getColor(definition, mode)),
  }));
}

function cloneToken(token: TokenValue): TokenValue {
  return {
    hex: token.hex,
    ...(token.bg === undefined ? {} : { bg: token.bg }),
    ...(token.modifiers === undefined ? {} : { modifiers: [...token.modifiers] }),
    ...(token.fgRGB === undefined ? {} : { fgRGB: cloneRgb(token.fgRGB) }),
    ...(token.bgRGB === undefined ? {} : { bgRGB: cloneRgb(token.bgRGB) }),
  };
}

function cloneRgb(rgb: RGB): RGB {
  return [rgb[0], rgb[1], rgb[2]];
}
