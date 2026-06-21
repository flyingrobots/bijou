import type { LayoutBound, LayoutFact } from './envelope.part01.js';
export function normalizeRequiredText(value: string, message: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) throw new Error(message);
  return normalized;
}
export function freezeFacts(facts: readonly LayoutFact[]): readonly LayoutFact[] {
  return Object.freeze(
    facts.map((item) => Object.freeze({
      kind: item.kind,
      key: item.key,
      value: item.value,
    })),
  );
}
export function fact(key: string, value: LayoutFact['value']): LayoutFact {
  return Object.freeze({ kind: 'layout', key, value });
}
export function formatRange(min: number, max: LayoutBound): string {
  return `${String(min)}..${formatBound(max)}`;
}
export function formatPreference(min: number, preferred: number, max: LayoutBound): string {
  return `min ${String(min)} preferred ${String(preferred)} max ${formatBound(max)}`;
}
export function formatBound(bound: LayoutBound): string {
  return bound === 'unbounded' ? 'unbounded' : String(bound);
}
