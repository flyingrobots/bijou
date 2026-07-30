import type { ServiceHealth, WorkItem } from './canonical-app-contract.js';

export function tag(label: string): string {
  return `[${label.toUpperCase()}]`;
}

export function statusBadge(status: WorkItem['status']): string {
  if (status === 'done') return tag('done');
  if (status === 'doing') return tag('doing');
  if (status === 'blocked') return tag('blocked');
  return tag('todo');
}

export function serviceBadge(status: ServiceHealth['status']): string {
  if (status === 'healthy') return tag('healthy');
  if (status === 'watch') return tag('watch');
  return tag('degraded');
}

export function toFixedHeight(
  lines: readonly string[],
  maxInnerHeight: number,
): string[] {
  if (maxInnerHeight <= 0) return [];
  const out = [...lines].slice(0, maxInnerHeight);
  while (out.length < maxInnerHeight) out.push('');
  return out;
}
