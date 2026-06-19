import type { TokenValue, RGB } from './tokens.js';
import { hexToRgb, tryHexToRgb, rgbToHex, lighten, darken, mix, complementary, saturate, desaturate } from './color.js';
import type { ColorDefinition, TokenDefinition, TokenDefinitions, ColorTransform, TokenInput } from './graph-types.js';

export type ThemeMode = 'light' | 'dark';

export interface TokenGraph {
  get(path: string, mode?: ThemeMode): TokenValue;
  getColor(def: ColorDefinition, mode?: ThemeMode): string;
  set(path: string, definition: TokenInput): void;
  on(handler: (path: string) => void): { dispose(): void };
  import(defs: TokenDefinitions): void;
  dispose(): void;
}

type StoredDefinition = ColorDefinition | TokenDefinition;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

function isTokenValue(value: unknown): value is TokenValue {
  return isRecord(value) && typeof value['hex'] === 'string';
}

function isTokenDefinition(value: unknown): value is TokenDefinition {
  return isRecord(value) && 'fg' in value;
}

function isNestedDefinitions(value: unknown): value is TokenDefinitions {
  return isRecord(value)
    && !isTokenValue(value)
    && !isTokenDefinition(value)
    && !('ref' in value)
    && !('light' in value);
}

export function createTokenGraph(initial?: TokenDefinitions): TokenGraph {
  const definitions = new Map<string, StoredDefinition>();
  const subscribers = new Set<(path: string) => void>();
  const tokenCache = new Map<string, TokenValue>();
  const rgbCache = new Map<string, RGB | null>();

  if (initial) {
    importInternal('', initial);
  }

  function importInternal(basePath: string, defs: TokenDefinitions): void {
    for (const [key, value] of Object.entries(defs)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;

      if (isTokenValue(value)) {
        definitions.set(fullPath, {
          fg: value.hex,
          bg: value.bg,
          modifiers: value.modifiers,
          fgRGB: value.fgRGB,
          bgRGB: value.bgRGB,
        });
      } else if (isNestedDefinitions(value)) {
        importInternal(fullPath, value);
      } else {
        definitions.set(fullPath, value);
      }
    }
  }

  function clearCaches(): void {
    tokenCache.clear();
    rgbCache.clear();
  }

  function resolveRgb(hex: string | undefined): RGB | undefined {
    if (hex == null) return undefined;
    if (rgbCache.has(hex)) {
      return rgbCache.get(hex) ?? undefined;
    }

    const rgb = tryHexToRgb(hex);
    rgbCache.set(hex, rgb ?? null);
    return rgb;
  }

  function resolveColor(def: ColorDefinition, mode: ThemeMode, visited: Set<string>): string {
    if (typeof def === 'string') {
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
      if (isTokenDefinition(target)) {
        color = resolveColor(target.fg, mode, visited);
      } else {
        color = resolveColor(target, mode, visited);
      }

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
      default: {
        const exhaustive: never = transform;
        throw new Error(`Unknown transform type: ${String(exhaustive)}`);
      }
    }

    return result.hex;
  }

  const graph: TokenGraph = {
    get(path, mode = 'dark') {
      const cacheKey = `${mode}:${path}`;
      const cached = tokenCache.get(cacheKey);
      if (cached) return cached;

      const def = definitions.get(path);
      if (!def) throw new Error(`Token not found: ${path}`);

      if (isTokenDefinition(def)) {
        const tokenDef = def;
        const token = {
          hex: resolveColor(tokenDef.fg, mode, new Set([path])),
          bg: tokenDef.bg ? resolveColor(tokenDef.bg, mode, new Set([path])) : undefined,
          modifiers: tokenDef.modifiers,
        };
        const resolved: TokenValue = {
          ...token,
          fgRGB: tokenDef.fgRGB ?? resolveRgb(token.hex),
          bgRGB: token.bg != null ? (tokenDef.bgRGB ?? resolveRgb(token.bg)) : undefined,
        };
        tokenCache.set(cacheKey, resolved);
        return resolved;
      }

      const hex = resolveColor(def, mode, new Set([path]));
      const resolved: TokenValue = {
        hex,
        fgRGB: resolveRgb(hex),
      };
      tokenCache.set(cacheKey, resolved);
      return resolved;
    },

    getColor(def, mode = 'dark') {
      return resolveColor(def, mode, new Set());
    },

    set(path, definition) {
      if (isTokenValue(definition)) {
        definitions.set(path, {
          fg: definition.hex,
          bg: definition.bg,
          modifiers: definition.modifiers,
          fgRGB: definition.fgRGB,
          bgRGB: definition.bgRGB,
        });
      } else {
        definitions.set(path, definition);
      }
      clearCaches();
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
      clearCaches();
      for (const handler of subscribers) {
        handler('*');
      }
    },

    dispose() {
      clearCaches();
      definitions.clear();
      subscribers.clear();
    },
  };

  return graph;
}
