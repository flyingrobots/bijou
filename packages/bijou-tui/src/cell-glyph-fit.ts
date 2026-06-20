/**
 * Fit an output glyph to sampled 2x4 cell coverage.
 *
 * The samples use row-major order: row 0 left/right, row 1 left/right,
 * row 2 left/right, row 3 left/right.
 */

export type CellGlyphFitMode = 'unicode' | 'ascii';

export interface CellGlyphCandidate {
  readonly char: string;
  readonly coverage: readonly number[];
}

export interface CellGlyphFitOptions {
  readonly mode?: CellGlyphFitMode;
  readonly candidates?: readonly CellGlyphCandidate[];
  readonly fallback?: string;
}

const CELL_GLYPH_SAMPLE_COUNT = 8;
const DEFAULT_FALLBACK_GLYPH = ' ';

export const CELL_GLYPH_ASCII_DENSITY_RAMP = ' .:-=+*#%@';

export const CELL_GLYPH_UNICODE_CANDIDATES: readonly CellGlyphCandidate[] = [
  { char: ' ', coverage: mask(0, 0, 0, 0, 0, 0, 0, 0) },
  { char: '░', coverage: mask(0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25) },
  { char: '▒', coverage: mask(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5) },
  { char: '▓', coverage: mask(0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75) },
  { char: '█', coverage: mask(1, 1, 1, 1, 1, 1, 1, 1) },
  { char: '▀', coverage: mask(1, 1, 1, 1, 0, 0, 0, 0) },
  { char: '▄', coverage: mask(0, 0, 0, 0, 1, 1, 1, 1) },
  { char: '▌', coverage: mask(1, 0, 1, 0, 1, 0, 1, 0) },
  { char: '▐', coverage: mask(0, 1, 0, 1, 0, 1, 0, 1) },
  { char: '▘', coverage: mask(1, 0, 1, 0, 0, 0, 0, 0) },
  { char: '▝', coverage: mask(0, 1, 0, 1, 0, 0, 0, 0) },
  { char: '▖', coverage: mask(0, 0, 0, 0, 1, 0, 1, 0) },
  { char: '▗', coverage: mask(0, 0, 0, 0, 0, 1, 0, 1) },
  { char: '─', coverage: mask(0, 0, 1, 1, 1, 1, 0, 0) },
  { char: '│', coverage: mask(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5) },
  { char: '╱', coverage: mask(0, 1, 0, 1, 1, 0, 1, 0) },
  { char: '╲', coverage: mask(1, 0, 1, 0, 0, 1, 0, 1) },
];

export function fitCellGlyph(samples: readonly number[], options: CellGlyphFitOptions = {}): string {
  const normalizedSamples = normalizeSamples(samples);
  const candidates = options.candidates;
  if (candidates !== undefined) {
    return fitCandidateGlyph(normalizedSamples, candidates, options.fallback ?? DEFAULT_FALLBACK_GLYPH);
  }

  if (options.mode === 'ascii') {
    return fitAsciiDensityGlyph(normalizedSamples);
  }

  return fitCandidateGlyph(
    normalizedSamples,
    CELL_GLYPH_UNICODE_CANDIDATES,
    options.fallback ?? DEFAULT_FALLBACK_GLYPH,
  );
}

function fitCandidateGlyph(
  samples: readonly number[],
  candidates: readonly CellGlyphCandidate[],
  fallback: string,
): string {
  let bestCandidate: CellGlyphCandidate | undefined;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const score = meanSquaredCoverageError(samples, candidate.coverage);
    if (score < bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  }

  return bestCandidate?.char ?? fallback;
}

function fitAsciiDensityGlyph(samples: readonly number[]): string {
  const density = samples.reduce((sum, sample) => sum + sample, 0) / CELL_GLYPH_SAMPLE_COUNT;
  const rampIndex = Math.round(density * (CELL_GLYPH_ASCII_DENSITY_RAMP.length - 1));
  return CELL_GLYPH_ASCII_DENSITY_RAMP[rampIndex] ?? DEFAULT_FALLBACK_GLYPH;
}

function meanSquaredCoverageError(samples: readonly number[], candidate: readonly number[]): number {
  let total = 0;
  for (let index = 0; index < CELL_GLYPH_SAMPLE_COUNT; index++) {
    const delta = (samples[index] ?? 0) - clampUnit(candidate[index] ?? 0);
    total += delta * delta;
  }
  return total / CELL_GLYPH_SAMPLE_COUNT;
}

function normalizeSamples(samples: readonly number[]): readonly number[] {
  const normalized: number[] = [];
  for (let index = 0; index < CELL_GLYPH_SAMPLE_COUNT; index++) {
    normalized.push(clampUnit(samples[index] ?? 0));
  }
  return normalized;
}

function clampUnit(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function mask(...coverage: readonly number[]): readonly number[] {
  return coverage;
}
