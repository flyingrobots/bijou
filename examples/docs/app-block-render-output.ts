import type { Surface } from '../../packages/bijou/src/index.js';

type DimensionSeparatorType = 'x';

const DIMENSION_SEPARATOR = 'x' satisfies DimensionSeparatorType;

export function blockRenderOutputText(output: unknown, maxLength = 120): string {
  if (typeof output === 'string') {
    return compactPreviewText(output, maxLength);
  }
  if (isSurfaceLike(output)) {
    return `${String(output.width)}${DIMENSION_SEPARATOR}${String(output.height)}`;
  }
  try {
    return compactPreviewText(JSON.stringify(output), maxLength);
  } catch {
    return String(output);
  }
}

export function isSurfaceLike(value: unknown): value is Surface {
  return Boolean(
    value
      && typeof value === 'object'
      && 'width' in value
      && typeof value.width === 'number'
      && 'height' in value
      && typeof value.height === 'number'
      && 'get' in value
      && typeof value.get === 'function',
  );
}

function compactInlineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim() || '-';
}

function compactPreviewText(value: string, maxLength = 120): string {
  const compacted = compactInlineText(value);
  return compacted.length <= maxLength
    ? compacted
    : `${compacted.slice(0, Math.max(0, maxLength - 1))}…`;
}
