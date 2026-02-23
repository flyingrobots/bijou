import type { BijouContext } from '../../ports/context.js';
import type { IOPort } from '../../ports/io.js';
import { getDefaultContext } from '../../context.js';

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
  fallbackText?: string;
  ctx?: BijouContext;
}

const SIZE_CASCADE: Record<LogoSize, LogoSize[]> = {
  large: ['large', 'medium', 'small'],
  medium: ['medium', 'small'],
  small: ['small'],
};

export function selectLogoSize(cols: number, rows: number): LogoSize {
  if (cols < 60 || rows < 20) return 'small';
  if (cols < 100 || rows < 30) return 'medium';
  return 'large';
}

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
