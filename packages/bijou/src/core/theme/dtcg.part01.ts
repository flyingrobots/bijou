import type { TokenValue, RGB, TextModifier } from './tokens.js';

/** A single Design Token Community Group (DTCG) token with a typed value. */
export interface DTCGToken {
  /** Token type descriptor (e.g. 'color', 'gradient', 'string'). */
  $type?: string;
  /** The token's value, which may be a string, object, array, or a `{reference}`. */
  $value: unknown;
  /** Optional human-readable description of the token. */
  $description?: string;
}
/** A named group of DTCG tokens or nested groups. */
export type DTCGGroup = Record<string, unknown>;
/** A top-level DTCG document containing token groups and/or individual tokens. */
export type DTCGDocument = Record<string, unknown>;
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
export function rgbToHex(rgb: RGB): string {
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}
export function isDTCGToken(obj: unknown): obj is DTCGToken {
  return typeof obj === 'object' && obj !== null && '$value' in obj;
}
export function isObjectRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}
export function isTextModifier(value: unknown): value is TextModifier {
  return (
    value === 'bold' ||
    value === 'dim' ||
    value === 'strikethrough' ||
    value === 'inverse' ||
    value === 'underline' ||
    value === 'curly-underline' ||
    value === 'dotted-underline' ||
    value === 'dashed-underline'
  );
}
export function readModifiers(value: unknown): TextModifier[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const modifiers = value.filter(isTextModifier);
  return modifiers.length === value.length ? modifiers : undefined;
}
export function isRgb(value: unknown): value is RGB {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((channel) => typeof channel === 'number')
  );
}
export function resolveReference(ref: string, doc: DTCGDocument): unknown {
  // DTCG references look like "{color.primary}"
  const path = ref.replace(/^\{|\}$/g, '').split('.');
  let current: unknown = doc;
  for (const segment of path) {
    if (!isObjectRecord(current)) return undefined;
    current = current[segment];
  }
  if (isDTCGToken(current)) return current.$value;
  return current;
}
export function resolveValue(
  value: unknown,
  doc: DTCGDocument,
  seen?: Set<string>,
): unknown {
  if (
    typeof value === 'string' &&
    value.startsWith('{') &&
    value.endsWith('}')
  ) {
    const visitedRefs = seen ?? new Set<string>();
    if (visitedRefs.has(value)) {
      throw new Error(
        `Circular reference detected: ${[...visitedRefs, value].join(' → ')}`,
      );
    }
    visitedRefs.add(value);
    const resolved = resolveReference(value, doc);
    if (resolved === undefined) {
      throw new Error(`Unresolvable reference: ${value}`);
    }
    return resolveValue(resolved, doc, visitedRefs);
  }
  return value;
}
export function toTokenValue(value: unknown, doc: DTCGDocument): TokenValue {
  const resolved = resolveValue(value, doc);
  if (typeof resolved === 'string') {
    return { hex: resolved };
  }
  if (isObjectRecord(resolved)) {
    const hexValue = resolved['hex'];
    const bgValue = resolved['bg'];
    const hex = typeof hexValue === 'string' ? hexValue : '#000000';
    const modifiers = readModifiers(resolved['modifiers']);
    const bg = typeof bgValue === 'string' ? bgValue : undefined;
    const tv: TokenValue = { hex };
    if (bg) tv.bg = bg;
    if (modifiers) tv.modifiers = modifiers;
    return tv;
  }
  return { hex: '#000000' };
}
