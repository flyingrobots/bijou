export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function resolveQuitModalWidth(screenWidth: number): number {
  return Math.max(1, Math.min(48, screenWidth));
}
