import type { OverflowBehavior } from './types.js';

function normalizeOverflowValue(value: string | undefined): OverflowBehavior | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;

  if (
    normalized === 'wrap'
    || normalized === 'normal'
    || normalized === 'pre-wrap'
    || normalized === 'break-spaces'
    || normalized === 'break-word'
    || normalized === 'anywhere'
    || normalized === 'visible'
  ) {
    return 'wrap';
  }

  if (
    normalized === 'truncate'
    || normalized === 'clip'
    || normalized === 'hidden'
    || normalized === 'nowrap'
    || normalized === 'ellipsis'
  ) {
    return 'truncate';
  }

  return undefined;
}

export function resolveOverflowBehavior(
  explicit: OverflowBehavior | undefined,
  styles: Record<string, string> = {},
): OverflowBehavior {
  const direct = normalizeOverflowValue(explicit);
  if (direct) return direct;

  return normalizeOverflowValue(
    styles['overflow']
      ?? styles['overflow-x']
      ?? styles['text-overflow']
      ?? styles['white-space']
      ?? styles['text-wrap'],
  ) ?? 'wrap';
}
