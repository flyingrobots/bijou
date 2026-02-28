import type { BijouContext } from '../../ports/context.js';
import type { IOPort } from '../../ports/io.js';
import { getDefaultContext } from '../../context.js';

/** Available logo size tiers. */
export type LogoSize = 'small' | 'medium' | 'large';

/** Parsed logo content with dimension metadata. */
export interface LogoResult {
  /** The logo artwork as a multiline string. */
  text: string;
  /** Number of lines in the logo. */
  lines: number;
  /** Maximum character width across all lines. */
  width: number;
}

/** Size constraints used to filter logo candidates. */
export interface LogoConstraints {
  /** Maximum allowed character width. */
  maxWidth: number;
  /** Maximum allowed line count. */
  maxHeight: number;
}

/** Configuration for logo loading and display. */
export interface LogoOptions {
  /** Plain-text fallback when no logo file can be loaded (defaults to `"BIJOU"`). */
  fallbackText?: string;
  /** Bijou context for I/O operations. */
  ctx?: BijouContext;
}

/** Ordered fallback chains for each logo size (tries preferred size first, then smaller). */
const SIZE_CASCADE: Record<LogoSize, LogoSize[]> = {
  large: ['large', 'medium', 'small'],
  medium: ['medium', 'small'],
  small: ['small'],
};

/**
 * Select the best logo size tier for the given terminal dimensions.
 *
 * @param cols - Terminal width in columns.
 * @param rows - Terminal height in rows.
 * @returns The recommended {@link LogoSize}.
 */
export function selectLogoSize(cols: number, rows: number): LogoSize {
  if (cols < 60 || rows < 20) return 'small';
  if (cols < 100 || rows < 30) return 'medium';
  return 'large';
}

/**
 * Parse raw logo text into a {@link LogoResult}, trimming leading/trailing blank lines.
 *
 * @param raw - Raw text content of a logo file.
 * @returns Parsed logo with trimmed text, line count, and max width.
 */
function parseLogoContent(raw: string): LogoResult {
  const allLines = raw.split('\n');
  while (allLines.length > 0 && (allLines[0]?.trim() ?? '') === '') {
    allLines.shift();
  }
  while (allLines.length > 0 && (allLines[allLines.length - 1]?.trim() ?? '') === '') {
    allLines.pop();
  }
  const text = allLines.join('\n');
  const lines = allLines.length;
  const width = allLines.reduce((max, l) => Math.max(max, l.length), 0);
  return { text, lines, width };
}

/**
 * Load and parse all `.txt` logo files from a directory, filtering by constraints.
 *
 * Files that cannot be read or exceed the constraints are silently skipped.
 *
 * @param io - I/O port for filesystem access.
 * @param dir - Directory path containing logo `.txt` files.
 * @param constraints - Optional size constraints to filter candidates.
 * @returns Array of parsed logo results that fit within the constraints.
 */
function loadCandidates(io: IOPort, dir: string, constraints?: LogoConstraints): LogoResult[] {
  try {
    const fileNames = io.readDir(dir).filter((f) => f.endsWith('.txt'));
    const results: LogoResult[] = [];
    for (const name of fileNames) {
      try {
        const raw = io.readFile(io.joinPath(dir, name));
        const logo = parseLogoContent(raw);
        if (constraints && (logo.width > constraints.maxWidth || logo.lines > constraints.maxHeight)) {
          continue;
        }
        results.push(logo);
      } catch {
        // skip unreadable file
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Load a random logo from the filesystem, cascading through size tiers.
 *
 * Looks in `{logosDir}/{family}/{size}` for `.txt` files, trying smaller
 * sizes if the preferred size has no candidates. Returns a plain-text
 * fallback when no logo file can be found.
 *
 * @param logosDir - Root directory containing logo families.
 * @param family - Logo family subdirectory name.
 * @param size - Preferred logo size tier.
 * @param constraints - Optional dimension constraints to filter candidates.
 * @param options - Additional logo options (fallback text, context).
 * @returns A randomly selected {@link LogoResult}, or the fallback.
 */
export function loadRandomLogo(
  logosDir: string,
  family: string,
  size: LogoSize,
  constraints?: LogoConstraints,
  options?: LogoOptions,
): LogoResult {
  const fallbackText = options?.fallbackText ?? 'BIJOU';
  const fallback: LogoResult = { text: fallbackText, lines: 1, width: fallbackText.length };
  const sizes = SIZE_CASCADE[size];
  const io = options?.ctx?.io ?? getDefaultContext().io;

  for (const trySize of sizes) {
    const dir = io.joinPath(logosDir, family, trySize);
    const candidates = loadCandidates(io, dir, constraints);
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      if (picked !== undefined) return picked;
    }
  }

  return fallback;
}
