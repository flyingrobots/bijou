import type {
  Theme,
  TokenValue,
  GradientStop,
  RGB,
  BaseStatusKey,
  BaseUiKey,
  BaseGradientKey,
} from './tokens.js';
import {
  type DTCGDocument,
  hexToRgb,
  isDTCGToken,
  isObjectRecord,
  isRgb,
  resolveValue,
  toTokenValue,
} from './dtcg.part01.js';

export function toGradientStops(
  value: unknown,
  doc: DTCGDocument,
): GradientStop[] {
  const resolved = resolveValue(value, doc);
  if (!Array.isArray(resolved)) return [];
  return resolved.map((stop: unknown) => {
    const s = isObjectRecord(stop) ? stop : {};
    const pos = typeof s['pos'] === 'number' ? s['pos'] : 0;
    const color: RGB = isRgb(s['color'])
      ? s['color']
      : typeof s['color'] === 'string'
        ? hexToRgb(s['color'])
        : [0, 0, 0];
    return { pos, color };
  });
}
export function tokenFromGroup(
  group: unknown,
  key: string,
  doc: DTCGDocument,
): TokenValue {
  const source =
    isObjectRecord(group) && !isDTCGToken(group) ? group : undefined;
  const token = source?.[key];
  return isDTCGToken(token)
    ? toTokenValue(token.$value, doc)
    : { hex: '#000000' };
}
export function extractGroup(
  group: unknown,
  keys: readonly string[],
  doc: DTCGDocument,
): Record<string, TokenValue> {
  const result: Record<string, TokenValue> = {};
  for (const key of keys) {
    result[key] = tokenFromGroup(group, key, doc);
  }
  return result;
}
export const STATUS_KEYS: readonly BaseStatusKey[] = [
  'success',
  'error',
  'warning',
  'info',
  'pending',
  'active',
  'muted',
];
export const UI_KEYS: readonly BaseUiKey[] = [
  'cursor',
  'focusGutter',
  'scrollThumb',
  'scrollTrack',
  'sectionHeader',
  'logo',
  'tableHeader',
  'trackEmpty',
];
export const GRADIENT_KEYS: readonly BaseGradientKey[] = ['brand', 'progress'];
/**
 * Convert a DTCG document into a bijou Theme.
 * @param doc - DTCG document containing token groups for status, semantic, border, ui, and gradient.
 * @returns Fully-populated Theme with all built-in keys resolved.
 */
export function fromDTCG(doc: DTCGDocument): Theme {
  const nameToken = doc['name'];
  const name =
    isDTCGToken(nameToken) && typeof nameToken.$value === 'string'
      ? nameToken.$value
      : 'imported';

  const status = extractGroup(doc['status'], STATUS_KEYS, doc);
  const semanticGroup = doc['semantic'];
  const semantic = {
    success: tokenFromGroup(semanticGroup, 'success', doc),
    error: tokenFromGroup(semanticGroup, 'error', doc),
    warning: tokenFromGroup(semanticGroup, 'warning', doc),
    info: tokenFromGroup(semanticGroup, 'info', doc),
    accent: tokenFromGroup(semanticGroup, 'accent', doc),
    muted: tokenFromGroup(semanticGroup, 'muted', doc),
    primary: tokenFromGroup(semanticGroup, 'primary', doc),
  };
  const borderGroup = doc['border'];
  const border = {
    primary: tokenFromGroup(borderGroup, 'primary', doc),
    secondary: tokenFromGroup(borderGroup, 'secondary', doc),
    success: tokenFromGroup(borderGroup, 'success', doc),
    warning: tokenFromGroup(borderGroup, 'warning', doc),
    error: tokenFromGroup(borderGroup, 'error', doc),
    muted: tokenFromGroup(borderGroup, 'muted', doc),
  };
  const ui = extractGroup(doc['ui'], UI_KEYS, doc);
  const surfaceGroup = doc['surface'];
  const surface = {
    primary: tokenFromGroup(surfaceGroup, 'primary', doc),
    secondary: tokenFromGroup(surfaceGroup, 'secondary', doc),
    elevated: tokenFromGroup(surfaceGroup, 'elevated', doc),
    overlay: tokenFromGroup(surfaceGroup, 'overlay', doc),
    muted: tokenFromGroup(surfaceGroup, 'muted', doc),
  };

  const gradient: Record<string, GradientStop[]> = {};
  const gradientGroup =
    isObjectRecord(doc['gradient']) && !isDTCGToken(doc['gradient'])
      ? doc['gradient']
      : undefined;
  for (const key of GRADIENT_KEYS) {
    const token = gradientGroup?.[key];
    if (isDTCGToken(token)) {
      gradient[key] = toGradientStops(token.$value, doc);
    } else {
      gradient[key] = [];
    }
  }

  return { name, status, semantic, gradient, border, ui, surface };
}
