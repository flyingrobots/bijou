/**
 * Shared numeric sanitizers for user-facing option boundaries.
 *
 * Bijou internals want whole, finite numbers. These helpers normalize
 * nullish, non-finite, negative, and fractional inputs at the boundary so
 * components do not each reinvent slightly different guards.
 */

function normalizeFiniteInt(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  return Math.floor(value);
}

function sanitizeInt(value: number | undefined, fallback: number, min: number): number {
  const safeMin = normalizeFiniteInt(min) ?? 0;
  const safeFallback = Math.max(safeMin, normalizeFiniteInt(fallback) ?? safeMin);
  const safeValue = normalizeFiniteInt(value);
  return safeValue == null ? safeFallback : Math.max(safeMin, safeValue);
}

/** Clamp to a finite whole number greater than or equal to zero. */
export function sanitizeNonNegativeInt(value: number | undefined, fallback = 0): number {
  return sanitizeInt(value, fallback, 0);
}

/** Clamp to a finite whole number greater than or equal to one. */
export function sanitizePositiveInt(value: number | undefined, fallback = 1): number {
  return sanitizeInt(value, fallback, 1);
}
