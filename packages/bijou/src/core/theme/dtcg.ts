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

// --- DTCG Types ---

export interface DTCGToken {
  $type?: string;
  $value: unknown;
  $description?: string;
}

export interface DTCGGroup {
  [key: string]: DTCGToken | DTCGGroup;
}

export interface DTCGDocument {
  [key: string]: DTCGToken | DTCGGroup;
}

// --- Helpers ---

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

function resolveReference(ref: string, doc: DTCGDocument): unknown {
  // DTCG references look like "{color.primary}"
  const path = ref.replace(/^\{|\}$/g, '').split('.');
  let current: unknown = doc;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return ref;
    current = (current as Record<string, unknown>)[segment];
  }
  if (isDTCGToken(current)) return current.$value;
  return current;
}

function resolveValue(value: unknown, doc: DTCGDocument): unknown {
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    return resolveReference(value, doc);
  }
  return value;
}

function toTokenValue(value: unknown, doc: DTCGDocument): TokenValue {
  const resolved = resolveValue(value, doc);
  if (typeof resolved === 'string') {
    return { hex: resolved };
  }
  if (typeof resolved === 'object' && resolved !== null) {
    const obj = resolved as Record<string, unknown>;
    const hex = typeof obj['hex'] === 'string' ? obj['hex'] : '#000000';
    const modifiers = Array.isArray(obj['modifiers'])
      ? (obj['modifiers'] as TextModifier[])
      : undefined;
    return modifiers ? { hex, modifiers } : { hex };
  }
  return { hex: '#000000' };
}

function toGradientStops(value: unknown, doc: DTCGDocument): GradientStop[] {
  const resolved = resolveValue(value, doc);
  if (!Array.isArray(resolved)) return [];
  return resolved.map((stop: unknown) => {
    const s = stop as Record<string, unknown>;
    const pos = typeof s['pos'] === 'number' ? s['pos'] : 0;
    const color = Array.isArray(s['color'])
      ? (s['color'] as RGB)
      : typeof s['color'] === 'string'
        ? hexToRgb(s['color'] as string)
        : [0, 0, 0] as RGB;
    return { pos, color };
  });
}

// --- fromDTCG ---

function extractGroup<K extends string>(
  group: DTCGGroup | undefined,
  keys: readonly K[],
  doc: DTCGDocument,
): Record<K, TokenValue> {
  const result = {} as Record<K, TokenValue>;
  for (const key of keys) {
    const token = group?.[key];
    if (isDTCGToken(token)) {
      result[key] = toTokenValue(token.$value, doc);
    } else {
      result[key] = { hex: '#000000' };
    }
  }
  return result;
}

const STATUS_KEYS: readonly BaseStatusKey[] = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
const SEMANTIC_KEYS = ['success', 'error', 'warning', 'info', 'accent', 'muted', 'primary'] as const;
const BORDER_KEYS = ['primary', 'secondary', 'success', 'warning', 'error', 'muted'] as const;
const UI_KEYS: readonly BaseUiKey[] = ['cursor', 'scrollThumb', 'scrollTrack', 'sectionHeader', 'logo', 'tableHeader', 'trackEmpty'];
const GRADIENT_KEYS: readonly BaseGradientKey[] = ['brand', 'progress'];

export function fromDTCG(doc: DTCGDocument): Theme {
  const name = typeof (doc['name'] as DTCGToken | undefined)?.$value === 'string'
    ? (doc['name'] as DTCGToken).$value as string
    : 'imported';

  const statusGroup = doc['status'] as DTCGGroup | undefined;
  const semanticGroup = doc['semantic'] as DTCGGroup | undefined;
  const borderGroup = doc['border'] as DTCGGroup | undefined;
  const uiGroup = doc['ui'] as DTCGGroup | undefined;
  const gradientGroup = doc['gradient'] as DTCGGroup | undefined;

  const status = extractGroup(statusGroup, STATUS_KEYS, doc);
  const semantic = extractGroup(semanticGroup, SEMANTIC_KEYS, doc);
  const border = extractGroup(borderGroup, BORDER_KEYS, doc);
  const ui = extractGroup(uiGroup, UI_KEYS, doc);

  const gradient = {} as Record<BaseGradientKey, GradientStop[]>;
  for (const key of GRADIENT_KEYS) {
    const token = gradientGroup?.[key];
    if (isDTCGToken(token)) {
      gradient[key] = toGradientStops(token.$value, doc);
    } else {
      gradient[key] = [];
    }
  }

  return { name, status, semantic, gradient, border, ui };
}

// --- toDTCG ---

function tokenToDTCG(token: TokenValue): DTCGToken {
  if (token.modifiers && token.modifiers.length > 0) {
    return {
      $type: 'color',
      $value: { hex: token.hex, modifiers: token.modifiers },
    };
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

function recordToDTCGGroup<K extends string>(record: Record<K, TokenValue>): DTCGGroup {
  const group: DTCGGroup = {};
  for (const [key, value] of Object.entries(record) as Array<[string, TokenValue]>) {
    group[key] = tokenToDTCG(value);
  }
  return group;
}

export function toDTCG(theme: Theme): DTCGDocument {
  const doc: DTCGDocument = {};

  doc['name'] = { $type: 'string', $value: theme.name };
  doc['status'] = recordToDTCGGroup(theme.status);
  doc['semantic'] = recordToDTCGGroup(theme.semantic);
  doc['border'] = recordToDTCGGroup(theme.border);
  doc['ui'] = recordToDTCGGroup(theme.ui);

  const gradientDoc: DTCGGroup = {};
  for (const [key, stops] of Object.entries(theme.gradient) as Array<[string, GradientStop[]]>) {
    gradientDoc[key] = gradientToDTCG(stops);
  }
  doc['gradient'] = gradientDoc;

  return doc;
}
