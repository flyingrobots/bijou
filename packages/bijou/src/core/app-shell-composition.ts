import {
  isProviderScope,
  type BindingFact,
  type CommandIntent,
  type ProviderScope,
  type ViewDataContract,
} from './binding.js';
import {
  isBlockDefinition,
  type BlockDefinition,
} from './block-metadata.js';

const APP_SHELL_COMPOSITION_BRAND: unique symbol = Symbol('AppShellComposition');

export type AppShellSlotId =
  | 'navigation'
  | 'content'
  | 'inspector'
  | 'status'
  | 'overlays';

export type AppShellSlotContent =
  | BlockDefinition
  | readonly AppShellSlotContent[];

export interface AppShellSlots {
  readonly navigation?: AppShellSlotContent;
  readonly content: AppShellSlotContent;
  readonly inspector?: AppShellSlotContent;
  readonly status?: AppShellSlotContent;
  readonly overlays?: AppShellSlotContent;
}

export interface AppShellCompositionInput {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly providers?: ProviderScope;
  readonly slots: AppShellSlots;
  readonly facts?: readonly BindingFact[];
}

export interface AppShellSlot {
  readonly id: AppShellSlotId;
  readonly blocks: readonly BlockDefinition[];
}

const APP_SHELL_SLOT_IDS: readonly AppShellSlotId[] = [
  'navigation',
  'content',
  'inspector',
  'status',
  'overlays',
];
const EMPTY_FACTS = Object.freeze([]) as readonly BindingFact[];
const EMPTY_BLOCKS = Object.freeze([]) as readonly BlockDefinition[];

export class AppShellComposition {
  readonly [APP_SHELL_COMPOSITION_BRAND] = true;
  readonly #slotsById: ReadonlyMap<AppShellSlotId, AppShellSlot>;
  readonly #providers: ProviderScope | undefined;
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];

  constructor(input: AppShellCompositionInput) {
    if (input === undefined || input === null || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('app shell composition: input must be an object');
    }

    if (input.providers !== undefined && !isProviderScope(input.providers)) {
      throw new Error('app shell composition: providers must be created by providerScope()');
    }

    const slotsById = normalizeSlots(input.slots);
    if (!slotsById.has('content')) {
      throw new Error('app shell composition: content slot is required');
    }

    this.#slotsById = slotsById;
    this.#providers = input.providers;
    this.id = optionalTrimmedText(input.id);
    this.label = optionalTrimmedText(input.label);
    this.description = optionalTrimmedText(input.description);
    this.facts = freezeFacts(input.facts);
    Object.freeze(this);
  }

  slotIds(): readonly AppShellSlotId[] {
    return Object.freeze([...this.#slotsById.keys()]);
  }

  slots(): readonly AppShellSlot[] {
    return Object.freeze([...this.#slotsById.values()]);
  }

  slot(slotId: AppShellSlotId): readonly BlockDefinition[] {
    return this.#slotsById.get(normalizeSlotId(slotId))?.blocks ?? EMPTY_BLOCKS;
  }

  blocks(): readonly BlockDefinition[] {
    return Object.freeze(
      [...this.#slotsById.values()].flatMap((slot) => slot.blocks),
    );
  }

  dataContracts(): readonly ViewDataContract[] {
    return Object.freeze(
      this.blocks().flatMap((block) => (block.data === undefined ? [] : [block.data])),
    );
  }

  commandIntents(): readonly CommandIntent[] {
    return Object.freeze(
      this.blocks().flatMap((block) => block.commands ?? []),
    );
  }

  providerScope(): ProviderScope | undefined {
    return this.#providers;
  }
}

export function defineAppShellComposition(
  input: AppShellCompositionInput,
): AppShellComposition {
  return new AppShellComposition(input);
}

export function isAppShellComposition(value: unknown): value is AppShellComposition {
  return Boolean(
    value
      && typeof value === 'object'
      && (value as AppShellCompositionBrandCarrier)[APP_SHELL_COMPOSITION_BRAND] === true,
  );
}

interface AppShellCompositionBrandCarrier {
  readonly [APP_SHELL_COMPOSITION_BRAND]?: true;
}

function normalizeSlots(slots: unknown): ReadonlyMap<AppShellSlotId, AppShellSlot> {
  if (slots === undefined || slots === null || typeof slots !== 'object' || Array.isArray(slots)) {
    throw new Error('app shell composition: slots must be an object');
  }

  const slotsById = new Map<AppShellSlotId, AppShellSlot>();
  for (const [rawSlotId, content] of Object.entries(slots)) {
    if (content === undefined) {
      continue;
    }

    const slotId = normalizeSlotId(rawSlotId);
    if (slotsById.has(slotId)) {
      throw new Error(`app shell composition: duplicate slot ${slotId}`);
    }

    const blocks = normalizeSlotContent(content, `slots.${slotId}`);
    if (blocks.length === 0) {
      throw new Error(`app shell composition: slot ${slotId} must include at least one block`);
    }

    slotsById.set(slotId, Object.freeze({
      id: slotId,
      blocks,
    }));
  }

  return slotsById;
}

function normalizeSlotContent(
  content: unknown,
  path: string,
): readonly BlockDefinition[] {
  if (Array.isArray(content)) {
    return Object.freeze(
      content.flatMap((item, index) => normalizeSlotContent(item, `${path}[${index}]`)),
    );
  }

  if (!isBlockDefinition(content)) {
    throw new Error(`${path}: slot content must be created by defineBlock()`);
  }

  return Object.freeze([content]);
}

function normalizeSlotId(slotId: string): AppShellSlotId {
  const normalized = slotId.trim();
  if (!APP_SHELL_SLOT_IDS.includes(normalized as AppShellSlotId)) {
    throw new Error(`app shell composition: unsupported slot ${normalized}`);
  }

  return normalized as AppShellSlotId;
}

function optionalTrimmedText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
}

function freezeFacts(facts: readonly BindingFact[] | undefined): readonly BindingFact[] {
  if (facts === undefined || facts.length === 0) {
    return EMPTY_FACTS;
  }

  return Object.freeze(
    facts.map((fact) => Object.freeze({ ...fact })),
  );
}
