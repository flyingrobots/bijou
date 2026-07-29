import type { BindingFact } from './binding.js';
import { isBlockDefinition, type BlockDefinition } from './block-metadata.js';
import type { AppShellSlot, AppShellSlotId } from './app-shell-composition.js';

const SLOT_IDS: readonly AppShellSlotId[] = [
  'navigation',
  'content',
  'inspector',
  'status',
  'overlays',
];

export const EMPTY_APP_SHELL_FACTS = Object.freeze(
  [],
) as readonly BindingFact[];
export const EMPTY_APP_SHELL_BLOCKS = Object.freeze(
  [],
) as readonly BlockDefinition[];

export function normalizeAppShellSlots(
  slots: unknown,
): ReadonlyMap<AppShellSlotId, AppShellSlot> {
  if (
    slots === undefined ||
    slots === null ||
    typeof slots !== 'object' ||
    Array.isArray(slots)
  ) {
    throw new Error('app shell composition: slots must be an object');
  }

  const slotsById = new Map<AppShellSlotId, AppShellSlot>();
  for (const [rawSlotId, content] of Object.entries(slots)) {
    if (content === undefined) continue;
    const slotId = normalizeAppShellSlotId(rawSlotId);
    if (slotsById.has(slotId)) {
      throw new Error(`app shell composition: duplicate slot ${slotId}`);
    }
    const blocks = normalizeSlotContent(content, `slots.${slotId}`);
    if (blocks.length === 0) {
      throw new Error(
        `app shell composition: slot ${slotId} must include at least one block`,
      );
    }
    slotsById.set(slotId, Object.freeze({ id: slotId, blocks }));
  }
  return slotsById;
}

function normalizeSlotContent(
  content: unknown,
  path: string,
): readonly BlockDefinition[] {
  if (Array.isArray(content)) {
    return Object.freeze(
      content.flatMap((item, index) =>
        normalizeSlotContent(item, `${path}[${String(index)}]`),
      ),
    );
  }
  if (!isBlockDefinition(content)) {
    throw new Error(`${path}: slot content must be created by defineBlock()`);
  }
  return Object.freeze([content]);
}

export function normalizeAppShellSlotId(slotId: string): AppShellSlotId {
  const normalized = slotId.trim();
  for (const id of SLOT_IDS) {
    if (normalized === id) return id;
  }
  throw new Error(`app shell composition: unsupported slot ${normalized}`);
}

export function optionalTrimmedText(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

export function freezeAppShellFacts(
  facts: readonly BindingFact[] | undefined,
): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_APP_SHELL_FACTS;
  }
  return Object.freeze(facts.map((fact) => Object.freeze({ ...fact })));
}
