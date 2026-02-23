import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export type LogoSize = 'small' | 'medium' | 'large';

export interface LogoResult {
  text: string;
  lines: number;
  width: number;
}

export interface LogoConstraints {
  maxWidth: number;
  maxHeight: number;
}

export interface LogoOptions {
  /** Fallback text when no logo files are found. Default: 'BIJOU'. */
  fallbackText?: string;
}

const SIZE_CASCADE: Record<LogoSize, LogoSize[]> = {
  large: ['large', 'medium', 'small'],
  medium: ['medium', 'small'],
  small: ['small'],
};

/** Choose a logo size bucket based on terminal dimensions. */
export function selectLogoSize(cols: number, rows: number): LogoSize {
  if (cols < 60 || rows < 20) return 'small';
  if (cols < 100 || rows < 30) return 'medium';
  return 'large';
}

/** Parse a single .txt file into a LogoResult, trimming leading and trailing blank lines. */
function parseLogoFile(filePath: string): LogoResult {
  const raw = readFileSync(filePath, 'utf8');
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
 * Read all .txt logos from a directory and return those that fit within
 * the given constraints. Returns an empty array on any fs error.
 */
function loadCandidates(dir: string, constraints?: LogoConstraints): LogoResult[] {
  try {
    const fileNames = readdirSync(dir).filter((f) => f.endsWith('.txt'));
    const results: LogoResult[] = [];
    for (const name of fileNames) {
      try {
        const logo = parseLogoFile(join(dir, name));
        if (constraints && (logo.width > constraints.maxWidth || logo.lines > constraints.maxHeight)) {
          continue;
        }
        results.push(logo);
      } catch {
        // skip unreadable file — other candidates may still load
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Read a random .txt logo from `{logosDir}/{family}/{size}/`.
 *
 * When `constraints` are provided, files that exceed the max dimensions
 * are filtered out. If nothing in the requested size fits, the loader
 * cascades down (large → medium → small) before falling back to the
 * configurable fallback text.
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

  for (const trySize of sizes) {
    const dir = join(logosDir, family, trySize);
    const candidates = loadCandidates(dir, constraints);
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      if (picked !== undefined) return picked;
    }
  }

  return fallback;
}
