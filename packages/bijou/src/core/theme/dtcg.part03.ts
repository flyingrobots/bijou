import type { Theme, TokenValue, GradientStop } from './tokens.js';
import {
  type DTCGDocument,
  type DTCGGroup,
  type DTCGToken,
  isObjectRecord,
  rgbToHex,
} from './dtcg.part01.js';
import { fromDTCG } from './dtcg.part02.js';

export function tokenToDTCG(token: TokenValue): DTCGToken {
  if ((token.modifiers && token.modifiers.length > 0) || token.bg) {
    const val: Record<string, unknown> = { hex: token.hex };
    if (token.bg) val['bg'] = token.bg;
    if (token.modifiers && token.modifiers.length > 0)
      val['modifiers'] = token.modifiers;
    return { $type: 'color', $value: val };
  }
  return { $type: 'color', $value: token.hex };
}
export function gradientToDTCG(stops: GradientStop[]): DTCGToken {
  return {
    $type: 'gradient',
    $value: stops.map((s) => ({
      pos: s.pos,
      color: rgbToHex(s.color),
    })),
  };
}
export function recordToDTCGGroup<V>(
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
export function loadTheme(
  io: { readFile(path: string): string },
  path: string,
): Theme {
  const content = io.readFile(path);
  const doc = parseDTCGDocument(JSON.parse(content));
  return fromDTCG(doc);
}
export function parseDTCGDocument(value: unknown): DTCGDocument {
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
  io: {
    readDir(path: string): string[];
    readFile(path: string): string;
    joinPath(...s: string[]): string;
  },
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
