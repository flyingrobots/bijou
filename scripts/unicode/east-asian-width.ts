import { createHash } from 'node:crypto';

/** One inclusive code point range. */
export type CodePointRange = readonly [first: number, last: number];

/** A vendored input file the generated table was built from. */
export interface UcdInput {
  readonly path: string;
  readonly sha256: string;
}

const LAST_CODE_POINT = 0x10ffff;
const WIDE_CLASSES = new Set(['W', 'F']);
const LINE = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*(A|F|H|N|Na|W)\b/u;
const MISSING = /^#\s*@missing:\s*([0-9A-F]{4,6})\.\.([0-9A-F]{4,6})\s*;\s*(A|F|H|N|Na|W)\b/u;

/** SHA-256 of the exact bytes, as lowercase hex. */
export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Read `EastAsianWidth.txt` and return every code point whose
 * East_Asian_Width is W or F, as merged inclusive ranges in order.
 *
 * `@missing` lines set defaults for code points no data line lists, in file
 * order, as UAX #44 specifies; data lines then override them.
 */
export function parseEastAsianWide(text: string): readonly CodePointRange[] {
  const wide = new Uint8Array(LAST_CODE_POINT + 1);
  const lines = text.split('\n');
  for (const line of lines) {
    const missing = MISSING.exec(line);
    if (missing !== null) mark(wide, missing[1], missing[2], missing[3]);
  }
  for (const line of lines) {
    const data = LINE.exec(line);
    if (data !== null) mark(wide, data[1], data[2] ?? data[1], data[3]);
  }
  return toRanges(wide);
}

function mark(
  wide: Uint8Array,
  first: string | undefined,
  last: string | undefined,
  value: string | undefined,
): void {
  if (first === undefined || last === undefined || value === undefined) return;
  wide.fill(WIDE_CLASSES.has(value) ? 1 : 0, parseInt(first, 16), parseInt(last, 16) + 1);
}

function toRanges(wide: Uint8Array): readonly CodePointRange[] {
  const ranges: CodePointRange[] = [];
  let start = -1;
  for (let cp = 0; cp <= LAST_CODE_POINT + 1; cp += 1) {
    const isWide = cp <= LAST_CODE_POINT && wide[cp] === 1;
    if (isWide && start < 0) start = cp;
    if (!isWide && start >= 0) {
      ranges.push([start, cp - 1]);
      start = -1;
    }
  }
  return ranges;
}

/** Read the `Unicode version` from the first line of a UCD file. */
export function ucdFileVersion(text: string): string {
  const match = /^#\s*\S+?-(\d+\.\d+\.\d+)\.txt/u.exec(text);
  if (match?.[1] === undefined) throw new Error('UCD file has no versioned name line');
  return match[1];
}

const hex = (cp: number): string => `0x${cp.toString(16).padStart(4, '0')}`;

/** Render the checked-in TypeScript table. The output is deterministic. */
export function renderEastAsianWideTable(options: {
  readonly version: string;
  readonly generator: string;
  readonly license: string;
  readonly inputs: readonly UcdInput[];
  readonly ranges: readonly CodePointRange[];
}): string {
  const header = [
    '// generated, do not edit.',
    `// Generator: ${options.generator} (npm run unicode:wide-table).`,
    `// Source: Unicode Character Database ${options.version}, UAX #11 East_Asian_Width.`,
    ...options.inputs.map((input) => `// Input: ${input.path} sha256 ${input.sha256}`),
    `// Unicode data (c) Unicode, Inc., Unicode License v3: ${options.license}`,
    '// Each entry is an inclusive [first, last] range of code points whose',
    '// East_Asian_Width is W (Wide) or F (Fullwidth), merged and sorted.',
    '',
    `export const EAST_ASIAN_WIDE_UNICODE_VERSION = '${options.version}';`,
    '',
    'export const EAST_ASIAN_WIDE_RANGES: readonly (readonly [number, number])[] = [',
  ];
  const body = options.ranges.map(([first, last]) => `  [${hex(first)}, ${hex(last)}],`);
  return [...header, ...body, '];', ''].join('\n');
}
