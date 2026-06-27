import type { RGB } from './tokens.js';
import { hexToRgb, rgbToHex, tryHexToRgb } from './color.js';
import type { StoredDefinition } from './graph-guards.js';
import { isTokenDefinition } from './graph-guards.js';
import { applyGraphColorTransform } from './graph-transform.js';
import { evaluateThemeColorRule } from './theme-rule-evaluate.js';
import { isThemeColorRuleDefinition } from './theme-rules.js';
import type {
  ColorDefinition,
  ColorTransform,
  ThemeColorRuleDefinition,
  ThemeRuleInspection,
} from './graph-types.js';

type ThemeMode = 'light' | 'dark';

export interface GraphColorResolver {
  resolveColor(def: ColorDefinition | StoredDefinition, mode: ThemeMode, visited: Set<string>): string;
  resolveRgb(hex: string | undefined): RGB | undefined;
  inspectRule(rule: ThemeColorRuleDefinition, path: string, mode: ThemeMode): ThemeRuleInspection;
}

export function createGraphColorResolver(
  definitions: ReadonlyMap<string, StoredDefinition>,
  rgbCache: Map<string, RGB | null>,
): GraphColorResolver {
  function resolveRgb(hex: string | undefined): RGB | undefined {
    if (hex == null) return undefined;
    if (rgbCache.has(hex)) return rgbCache.get(hex) ?? undefined;
    const rgb = tryHexToRgb(hex);
    rgbCache.set(hex, rgb ?? null);
    return rgb;
  }

  function resolveColor(def: ColorDefinition | StoredDefinition, mode: ThemeMode, visited: Set<string>): string {
    if (typeof def === 'string') return normalizeColor(def);
    if (isThemeColorRuleDefinition(def)) return inspectRule(def, lastVisitedPath(visited), mode, visited).hex;
    if ('light' in def && 'dark' in def) return resolveColor(mode === 'light' ? def.light : def.dark, mode, visited);
    if ('ref' in def) return resolveReference(def, mode, visited);
    throw new Error(`Invalid color definition: ${JSON.stringify(def)}`);
  }

  function inspectRule(
    rule: ThemeColorRuleDefinition,
    path: string,
    mode: ThemeMode,
    visited = new Set([path]),
  ): ThemeRuleInspection {
    return evaluateThemeColorRule(rule, { definitions, mode, path, visited, resolveColor });
  }

  function resolveReference(def: Extract<ColorDefinition, { readonly ref: string }>, mode: ThemeMode, visited: Set<string>): string {
    if (visited.has(def.ref)) {
      throw new Error(`Circular token reference detected: ${Array.from(visited).join(' -> ')} -> ${def.ref}`);
    }
    visited.add(def.ref);
    const target = resolveReferenceTarget(def.ref, mode, visited);
    if (target === undefined) throw new Error(`Token reference not found: ${def.ref}`);
    return applyTransforms(target, def.transform ?? [], mode, visited);
  }

  function resolveReferenceTarget(path: string, mode: ThemeMode, visited: Set<string>): string | undefined {
    if (path.endsWith('.bg')) {
      const base = definitions.get(path.slice(0, -3));
      if (base !== undefined && isTokenDefinition(base) && base.bg !== undefined) return resolveColor(base.bg, mode, visited);
    }
    const target = definitions.get(path);
    if (target === undefined) return undefined;
    return isTokenDefinition(target) ? resolveColor(target.fg, mode, visited) : resolveColor(target, mode, visited);
  }

  function applyTransforms(
    color: string,
    transforms: readonly ColorTransform[],
    mode: ThemeMode,
    visited: Set<string>,
  ): string {
    let next = color;
    for (const transform of transforms) {
      next = applyGraphColorTransform(next, transform, path => resolveColor({ ref: path }, mode, visited));
    }
    return next;
  }

  return { resolveColor, resolveRgb, inspectRule };
}

function normalizeColor(color: string): string {
  try {
    return rgbToHex(hexToRgb(color));
  } catch {
    return color;
  }
}

function lastVisitedPath(visited: ReadonlySet<string>): string {
  return [...visited].at(-1) ?? '<inline>';
}
