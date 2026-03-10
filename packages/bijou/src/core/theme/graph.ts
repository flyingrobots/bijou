import type { TokenValue } from './tokens.js';
import { 
  hexToRgb, 
  rgbToHex, 
  lighten, 
  darken, 
  mix, 
  complementary, 
  saturate, 
  desaturate 
} from './color.js';
import type { 
  ColorDefinition, 
  TokenDefinition, 
  TokenDefinitions, 
  ColorTransform 
} from './graph-types.js';

export type ThemeMode = 'light' | 'dark';

/**
 * Reactive and Semantic Token Graph for Bijou themes.
 */
export interface TokenGraph {
  /** Resolve a token definition path to a final TokenValue. */
  get(path: string, mode?: ThemeMode): TokenValue;
  /** Resolve a raw color definition to a hex string. */
  getColor(def: ColorDefinition, mode?: ThemeMode): string;
  /** Update a definition in the graph and notify subscribers. */
  set(path: string, definition: ColorDefinition | TokenDefinition): void;
  /** Register a listener for graph changes. */
  on(handler: (path: string) => void): { dispose(): void };
  /** Import a standard Theme object or a nested definitions object. */
  import(defs: TokenDefinitions): void;
}

function isTokenValue(obj: any): obj is TokenValue {
  return typeof obj === 'object' && obj !== null && 'hex' in obj;
}

/**
 * Create a new TokenGraph.
 */
export function createTokenGraph(initial?: TokenDefinitions): TokenGraph {
  const definitions = new Map<string, any>();
  const subscribers = new Set<(path: string) => void>();

  if (initial) {
    importInternal('', initial);
  }

  function importInternal(basePath: string, defs: any) {
    for (const [key, value] of Object.entries(defs)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;
      
      if (isTokenValue(value)) {
        // Convert TokenValue to TokenDefinition
        definitions.set(fullPath, {
          fg: value.hex,
          bg: value.bg,
          modifiers: value.modifiers,
        });
      } else if (typeof value === 'object' && value !== null && !('ref' in value) && !('light' in value) && !('fg' in value)) {
        importInternal(fullPath, value);
      } else {
        definitions.set(fullPath, value);
      }
    }
  }

  function resolveColor(def: ColorDefinition, mode: ThemeMode, visited: Set<string>): string {
    if (typeof def === 'string') {
      // Normalize hex string
      try {
        return rgbToHex(hexToRgb(def));
      } catch {
        return def;
      }
    }

    if ('light' in def && 'dark' in def) {
      return resolveColor(mode === 'light' ? def.light : def.dark, mode, visited);
    }

    if ('ref' in def) {
      if (visited.has(def.ref)) {
        throw new Error(`Circular token reference detected: ${Array.from(visited).join(' -> ')} -> ${def.ref}`);
      }
      visited.add(def.ref);
      
      const target = definitions.get(def.ref);
      if (!target) {
        throw new Error(`Token reference not found: ${def.ref}`);
      }

      let color: string;
      if (typeof target === 'object' && 'fg' in target) {
        color = resolveColor(target.fg, mode, visited);
      } else {
        color = resolveColor(target as ColorDefinition, mode, visited);
      }

      // Apply transforms
      if (def.transform) {
        for (const t of def.transform) {
          color = applyTransform(color, t, mode, visited);
        }
      }

      return color;
    }

    throw new Error(`Invalid color definition: ${JSON.stringify(def)}`);
  }

  function applyTransform(color: string, transform: ColorTransform, mode: ThemeMode, visited: Set<string>): string {
    const dummyToken: TokenValue = { hex: color };
    let result: TokenValue;

    switch (transform.type) {
      case 'darken': result = darken(dummyToken, transform.amount); break;
      case 'lighten': result = lighten(dummyToken, transform.amount); break;
      case 'saturate': result = saturate(dummyToken, transform.amount); break;
      case 'desaturate': result = desaturate(dummyToken, transform.amount); break;
      case 'complementary': result = complementary(dummyToken); break;
      case 'inverse': {
        const rgb = hexToRgb(color);
        result = { hex: rgbToHex([255 - rgb[0], 255 - rgb[1], 255 - rgb[2]]) };
        break;
      }
      case 'mix': {
        const otherColor = resolveColor({ ref: transform.with }, mode, visited);
        result = mix(dummyToken, { hex: otherColor }, transform.ratio ?? 0.5);
        break;
      }
      default:
        // @ts-ignore
        throw new Error(`Unknown transform type: ${transform.type}`);
    }

    return result.hex;
  }

  const graph: TokenGraph = {
    get(path, mode = 'dark') {
      const def = definitions.get(path);
      if (!def) throw new Error(`Token not found: ${path}`);

      if (typeof def === 'object' && 'fg' in def) {
        const tokenDef = def as TokenDefinition;
        return {
          hex: resolveColor(tokenDef.fg, mode, new Set([path])),
          bg: tokenDef.bg ? resolveColor(tokenDef.bg, mode, new Set([path])) : undefined,
          modifiers: tokenDef.modifiers,
        };
      }

      // If it's just a color definition, return it as a TokenValue
      return {
        hex: resolveColor(def as ColorDefinition, mode, new Set([path])),
      };
    },

    getColor(def, mode = 'dark') {
      return resolveColor(def, mode, new Set());
    },

    set(path, definition) {
      definitions.set(path, definition);
      for (const handler of subscribers) {
        handler(path);
      }
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
      importInternal('', defs);
      for (const handler of subscribers) {
        handler('*'); // Notify full re-import
      }
    },
  };

  return graph;
}
