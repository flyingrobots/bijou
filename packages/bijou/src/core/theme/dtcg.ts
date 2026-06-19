import type {
  Theme,
  TokenValue,
  GradientStop,
  RGB,
  TextModifier,
  BaseStatusKey,
  BaseUiKey,
  BaseGradientKey,
} from './tokens.js';

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

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(rgb: RGB): string {
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

function isDTCGToken(obj: unknown): obj is DTCGToken {
  return typeof obj === 'object' && obj !== null && '$value' in obj;
}

function isObjectRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function isTextModifier(value: unknown): value is TextModifier {
  return value === 'bold'
    || value === 'dim'
    || value === 'strikethrough'
    || value === 'inverse'
    || value === 'underline'
    || value === 'curly-underline'
    || value === 'dotted-underline'
    || value === 'dashed-underline';
}

function readModifiers(value: unknown): TextModifier[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const modifiers = value.filter(isTextModifier);
  return modifiers.length === value.length ? modifiers : undefined;
}

function isRgb(value: unknown): value is RGB {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel) => typeof channel === 'number');
}

function resolveReference(ref: string, doc: DTCGDocument): unknown {
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

function resolveValue(value: unknown, doc: DTCGDocument, seen?: Set<string>): unknown {
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const visitedRefs = seen ?? new Set<string>();
    if (visitedRefs.has(value)) {
      throw new Error(`Circular reference detected: ${[...visitedRefs, value].join(' → ')}`);
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

function toTokenValue(value: unknown, doc: DTCGDocument): TokenValue {
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

function toGradientStops(value: unknown, doc: DTCGDocument): GradientStop[] {
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

function tokenFromGroup(group: unknown, key: string, doc: DTCGDocument): TokenValue {
  const source = isObjectRecord(group) && !isDTCGToken(group) ? group : undefined;
  const token = source?.[key];
  return isDTCGToken(token) ? toTokenValue(token.$value, doc) : { hex: '#000000' };
}

function extractGroup(
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

const STATUS_KEYS: readonly BaseStatusKey[] = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
const UI_KEYS: readonly BaseUiKey[] = [
  'cursor',
  'focusGutter',
  'scrollThumb',
  'scrollTrack',
  'sectionHeader',
  'logo',
  'tableHeader',
  'trackEmpty',
];
const GRADIENT_KEYS: readonly BaseGradientKey[] = ['brand', 'progress'];

/**
 * Convert a DTCG document into a bijou Theme.
 * @param doc - DTCG document containing token groups for status, semantic, border, ui, and gradient.
 * @returns Fully-populated Theme with all built-in keys resolved.
 */
export function fromDTCG(doc: DTCGDocument): Theme {
  const nameToken = doc['name'];
  const name = isDTCGToken(nameToken) && typeof nameToken.$value === 'string'
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
  const gradientGroup = isObjectRecord(doc['gradient']) && !isDTCGToken(doc['gradient'])
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

function tokenToDTCG(token: TokenValue): DTCGToken {
  if ((token.modifiers && token.modifiers.length > 0) || token.bg) {
    const val: Record<string, unknown> = { hex: token.hex };
    if (token.bg) val['bg'] = token.bg;
    if (token.modifiers && token.modifiers.length > 0) val['modifiers'] = token.modifiers;
    return { $type: 'color', $value: val };
  }
  return { $type: 'color', $value: token.hex };
}

function gradientToDTCG(stops: GradientStop[]): DTCGToken {
  return {
    $type: 'gradient',
    $value: stops.map((s) => ({
      pos: s.pos,
      color: rgbToHex(s.color),
    })),
  };
}

function recordToDTCGGroup<V>(
  record: Readonly<Record<string, V>>,
  convert: (value: V) => DTCGToken,
): DTCGGroup {
  const group: DTCGGroup = {};
  for (const [key, value] of Object.entries(record)) {
    group[key] = convert(value);
  }
  return group;
}

/**
 * Convert a bijou Theme into a DTCG document for interop/export.
 * @param theme - Theme to serialize.
 * @returns DTCGDocument with all theme groups as DTCG token groups.
 */
export function toDTCG(theme: Theme): DTCGDocument {
  const doc: DTCGDocument = {};

  doc['name'] = { $type: 'string', $value: theme.name };
  doc['status'] = recordToDTCGGroup(theme.status, tokenToDTCG);
  doc['semantic'] = recordToDTCGGroup(theme.semantic, tokenToDTCG);
  doc['border'] = recordToDTCGGroup(theme.border, tokenToDTCG);
  doc['ui'] = recordToDTCGGroup(theme.ui, tokenToDTCG);
  doc['surface'] = recordToDTCGGroup(theme.surface, tokenToDTCG);
  doc['gradient'] = recordToDTCGGroup(theme.gradient, gradientToDTCG);

  return doc;
}

/**
 * Load a single theme from a DTCG JSON file using the provided IO port.
 * @param io - IO adapter with a `readFile` method.
 * @param path - File path to the JSON theme file.
 * @returns Parsed Theme.
 */
export function loadTheme(io: { readFile(path: string): string }, path: string): Theme {
  const content = io.readFile(path);
  const doc = parseDTCGDocument(JSON.parse(content));
  return fromDTCG(doc);
}

function parseDTCGDocument(value: unknown): DTCGDocument {
  if (!isObjectRecord(value)) {
    throw new Error('Invalid DTCG document: expected object payload');
  }
  return value;
}

/**
 * Load all `.json` files from a directory and return them as a theme record keyed by theme name.
 * @param io - IO adapter with `readDir`, `readFile`, and `joinPath` methods.
 * @param dirPath - Directory path to scan for theme JSON files.
 * @returns Record mapping theme names to parsed Themes (malformed files are silently skipped).
 */
export function loadThemesFromDir(
  io: { readDir(path: string): string[]; readFile(path: string): string; joinPath(...s: string[]): string },
  dirPath: string,
): Record<string, Theme> {
  const files = io.readDir(dirPath);
  const themes: Record<string, Theme> = {};
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const theme = loadTheme(io, io.joinPath(dirPath, file));
        themes[theme.name] = theme;
      } catch {
        // Skip malformed themes
      }
    }
  }
  return themes;
}
