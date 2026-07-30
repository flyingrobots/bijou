export function formatPerfValue(value: number, decimals: number): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : '--';
}
