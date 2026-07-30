import { formatDataVizNumber } from './stories-helper-format-data-viz-number.js';

export function compactDataVizValues(values: readonly number[], maxItems = 6): string {
  const formatted = values
    .map((value) => Number.isFinite(value) ? value : 0)
    .map((value) => formatDataVizNumber(value));
  if (formatted.length <= maxItems) {
    return formatted.join(', ');
  }

  const headCount = Math.max(2, Math.ceil(maxItems / 2));
  const tailCount = Math.max(1, Math.floor(maxItems / 2) - 1);
  return `${formatted.slice(0, headCount).join(', ')}, ..., ${formatted.slice(-tailCount).join(', ')}`;
}
