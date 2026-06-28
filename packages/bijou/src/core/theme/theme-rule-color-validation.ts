import { rgbToHex, tryHexToRgb } from './color.js';
import type { ThemeColorRuleDefinition } from './graph-types.js';

type ThemeRuleColorRole = 'target' | 'against';

export function normalizeThemeRuleColor(
  color: string,
  rule: ThemeColorRuleDefinition['rule'],
  path: string,
  role: ThemeRuleColorRole,
): string {
  const rgb = tryHexToRgb(color);
  if (rgb === undefined) {
    throw new Error(`Theme rule "${rule}" for "${path}" has invalid ${role} color: ${color}`);
  }
  return rgbToHex(rgb);
}
