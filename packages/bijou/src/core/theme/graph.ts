import type { TokenValue, RGB } from './tokens.js';
import type {
  ColorDefinition,
  TokenDefinition,
  TokenDefinitions,
  TokenGraphInspection,
  TokenInput,
} from './graph-types.js';
import { isTokenDefinition, type StoredDefinition } from './graph-guards.js';
import { importTokenDefinitions, setTokenDefinition } from './graph-import.js';
import { createGraphColorResolver } from './graph-resolve.js';
import { isThemeColorRuleDefinition } from './theme-rules.js';
import { collectGraphDefinitionDependencies } from './graph-dependencies.js';

export type ThemeMode = 'light' | 'dark';

export interface TokenGraph {
  get(path: string, mode?: ThemeMode): TokenValue;
  getColor(def: ColorDefinition, mode?: ThemeMode): string;
  inspect(path: string, mode?: ThemeMode): TokenGraphInspection;
  set(path: string, definition: TokenInput): void;
  on(handler: (path: string) => void): { dispose(): void };
  import(defs: TokenDefinitions): void;
  dispose(): void;
}

export function createTokenGraph(initial?: TokenDefinitions): TokenGraph {
  const definitions = new Map<string, StoredDefinition>();
  const subscribers = new Set<(path: string) => void>();
  const tokenCache = new Map<string, TokenValue>();
  const rgbCache = new Map<string, RGB | null>();
  const resolver = createGraphColorResolver(definitions, rgbCache);

  if (initial) importTokenDefinitions(definitions, initial);

  function clearCaches(): void {
    tokenCache.clear();
    rgbCache.clear();
  }

  const graph: TokenGraph = {
    get(path, mode = 'dark') {
      const cacheKey = `${mode}:${path}`;
      const cached = tokenCache.get(cacheKey);
      if (cached) return cached;

      const def = definitions.get(path);
      if (!def) throw new Error(`Token not found: ${path}`);

      const resolved = isTokenDefinition(def)
        ? resolveTokenValue(path, def, mode)
        : resolveColorValue(path, def, mode);
      tokenCache.set(cacheKey, resolved);
      return resolved;
    },

    getColor(def, mode = 'dark') {
      return resolver.resolveColor(def, mode, new Set());
    },

    inspect(path, mode = 'dark') {
      const def = definitions.get(path);
      if (!def) throw new Error(`Token not found: ${path}`);
      if (isThemeColorRuleDefinition(def)) return resolver.inspectRule(def, path, mode);
      return {
        kind: isTokenDefinition(def) ? 'token' : 'color',
        path,
        mode,
        hex: graph.get(path, mode).hex,
        dependencies: collectGraphDefinitionDependencies(def),
      };
    },

    set(path, definition) {
      setTokenDefinition(definitions, path, definition);
      notify(path);
    },

    on(handler) {
      subscribers.add(handler);
      return {
        dispose() {
          subscribers.delete(handler);
        },
      };
    },

    import(defs) {
      importTokenDefinitions(definitions, defs);
      notify('*');
    },

    dispose() {
      clearCaches();
      definitions.clear();
      subscribers.clear();
    },
  };

  function resolveTokenValue(path: string, def: TokenDefinition, mode: ThemeMode): TokenValue {
    const hex = resolver.resolveColor(def.fg, mode, new Set([path]));
    const bg = def.bg ? resolver.resolveColor(def.bg, mode, new Set([path])) : undefined;
    return {
      hex,
      ...(bg === undefined ? {} : { bg }),
      ...(def.modifiers === undefined ? {} : { modifiers: def.modifiers }),
      fgRGB: def.fgRGB ?? resolver.resolveRgb(hex),
      ...(bg === undefined ? {} : { bgRGB: def.bgRGB ?? resolver.resolveRgb(bg) }),
    };
  }

  function resolveColorValue(path: string, def: StoredDefinition, mode: ThemeMode): TokenValue {
    const hex = resolver.resolveColor(def, mode, new Set([path]));
    return {
      hex,
      fgRGB: resolver.resolveRgb(hex),
    };
  }

  function notify(path: string): void {
    clearCaches();
    for (const handler of subscribers) handler(path);
  }

  return graph;
}
