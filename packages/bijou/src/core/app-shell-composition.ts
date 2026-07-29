import {
  isProviderScope,
  type BindingFact,
  type CommandIntent,
  type ProviderScope,
  type ViewDataContract,
} from './binding.js';
import { type BlockDefinition } from './block-metadata.js';
import {
  EMPTY_APP_SHELL_BLOCKS,
  freezeAppShellFacts,
  normalizeAppShellSlotId,
  normalizeAppShellSlots,
  optionalTrimmedText,
} from './app-shell-composition-normalize.js';

const APP_SHELL_COMPOSITION_BRAND: unique symbol = Symbol(
  'AppShellComposition',
);

export type AppShellSlotId =
  'navigation' | 'content' | 'inspector' | 'status' | 'overlays';

export type AppShellSlotContent =
  BlockDefinition | readonly AppShellSlotContent[];

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

export class AppShellComposition {
  readonly [APP_SHELL_COMPOSITION_BRAND] = true;
  readonly #slotsById: ReadonlyMap<AppShellSlotId, AppShellSlot>;
  readonly #providers: ProviderScope | undefined;
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];

  constructor(input: AppShellCompositionInput) {
    const value: unknown = input;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('app shell composition: input must be an object');
    }
    if (input.providers !== undefined && !isProviderScope(input.providers)) {
      throw new Error(
        'app shell composition: providers must be created by providerScope()',
      );
    }

    const slotsById = normalizeAppShellSlots(input.slots);
    if (!slotsById.has('content')) {
      throw new Error('app shell composition: content slot is required');
    }

    this.#slotsById = slotsById;
    this.#providers = input.providers;
    this.id = optionalTrimmedText(input.id);
    this.label = optionalTrimmedText(input.label);
    this.description = optionalTrimmedText(input.description);
    this.facts = freezeAppShellFacts(input.facts);
    Object.freeze(this);
  }

  slotIds(): readonly AppShellSlotId[] {
    return Object.freeze([...this.#slotsById.keys()]);
  }

  slots(): readonly AppShellSlot[] {
    return Object.freeze([...this.#slotsById.values()]);
  }

  slot(slotId: AppShellSlotId): readonly BlockDefinition[] {
    return (
      this.#slotsById.get(normalizeAppShellSlotId(slotId))?.blocks ??
      EMPTY_APP_SHELL_BLOCKS
    );
  }

  blocks(): readonly BlockDefinition[] {
    return Object.freeze(
      [...this.#slotsById.values()].flatMap((slot) => slot.blocks),
    );
  }

  dataContracts(): readonly ViewDataContract[] {
    return Object.freeze(
      this.blocks().flatMap((block) =>
        block.data === undefined ? [] : [block.data],
      ),
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

export function isAppShellComposition(
  value: unknown,
): value is AppShellComposition {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value as AppShellCompositionBrandCarrier)[APP_SHELL_COMPOSITION_BRAND] ===
      true,
  );
}

interface AppShellCompositionBrandCarrier {
  readonly [APP_SHELL_COMPOSITION_BRAND]?: true;
}
