import type { TokenValue } from './tokens.js';
import type {
  ColorDefinition,
  ThemeColorRuleDefinition,
  TokenDefinition,
  TokenDefinitions,
} from './graph-types.js';
import { isThemeColorRuleDefinition } from './theme-rules.js';

export type StoredDefinition = ColorDefinition | TokenDefinition | ThemeColorRuleDefinition;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isTokenValue(value: unknown): value is TokenValue {
  return isRecord(value) && typeof value['hex'] === 'string';
}

export function isTokenDefinition(value: unknown): value is TokenDefinition {
  return isRecord(value) && 'fg' in value;
}

export function isNestedDefinitions(value: unknown): value is TokenDefinitions {
  return isRecord(value)
    && !isTokenValue(value)
    && !isTokenDefinition(value)
    && !isThemeColorRuleDefinition(value)
    && !('ref' in value)
    && !('light' in value);
}
