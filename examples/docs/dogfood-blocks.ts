import {
  isBlockDefinition,
  type BlockDefinition,
} from '@flyingrobots/bijou';

const DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND: unique symbol = Symbol('DogfoodBlockRegistryEntry');
const DOGFOOD_BLOCK_REGISTRY_BRAND: unique symbol = Symbol('DogfoodBlockRegistry');

export const DOGFOOD_BLOCK_PACKAGE = '@flyingrobots/bijou-dogfood';

export type DogfoodBlockRole =
  | 'app-shell'
  | 'title'
  | 'navigation'
  | 'article'
  | 'settings'
  | 'inspector'
  | 'preview'
  | 'workbench'
  | 'fixture';

export interface DogfoodBlockRegistryEntryInput {
  readonly block: BlockDefinition;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export interface DogfoodBlockRegistryEntry {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]: true;
  readonly block: BlockDefinition;
  readonly blockName: string;
  readonly packageName: string;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags: readonly string[];
}

export class DogfoodBlockRegistry {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]!: true;
  readonly #entries: readonly DogfoodBlockRegistryEntry[];
  readonly #entriesByBlockKey: ReadonlyMap<string, DogfoodBlockRegistryEntry>;
  readonly #entriesBySurfaceId: ReadonlyMap<string, DogfoodBlockRegistryEntry>;

  constructor(entries: readonly DogfoodBlockRegistryEntry[]) {
    if (!Array.isArray(entries)) {
      throw new Error('dogfood block registry: entries must be an array');
    }

    Object.defineProperty(this, DOGFOOD_BLOCK_REGISTRY_BRAND, { value: true });

    const entriesByBlockKey = new Map<string, DogfoodBlockRegistryEntry>();
    const entriesBySurfaceId = new Map<string, DogfoodBlockRegistryEntry>();
    const normalizedEntries: DogfoodBlockRegistryEntry[] = [];

    entries.forEach((entry, index) => {
      if (!isDogfoodBlockRegistryEntry(entry)) {
        throw new Error(
          `dogfood block registry: entry at index ${index} was not created by dogfoodBlockRegistryEntry()`,
        );
      }

      const blockKey = dogfoodBlockKey(entry.packageName, entry.blockName);
      if (entriesByBlockKey.has(blockKey)) {
        throw new Error(`dogfood block registry: duplicate block ${blockKey}`);
      }
      if (entriesBySurfaceId.has(entry.surfaceId)) {
        throw new Error(`dogfood block registry: duplicate surface id ${entry.surfaceId}`);
      }

      entriesByBlockKey.set(blockKey, entry);
      entriesBySurfaceId.set(entry.surfaceId, entry);
      normalizedEntries.push(entry);
    });

    this.#entries = Object.freeze(normalizedEntries);
    this.#entriesByBlockKey = entriesByBlockKey;
    this.#entriesBySurfaceId = entriesBySurfaceId;
    Object.freeze(this);
  }

  entries(): readonly DogfoodBlockRegistryEntry[] {
    return Object.freeze([...this.#entries]);
  }

  blocks(): readonly BlockDefinition[] {
    return Object.freeze(this.#entries.map((entry) => entry.block));
  }

  blockNames(): readonly string[] {
    return Object.freeze(this.#entries.map((entry) => entry.blockName));
  }

  surfaceIds(): readonly string[] {
    return Object.freeze(this.#entries.map((entry) => entry.surfaceId));
  }

  roles(): readonly DogfoodBlockRole[] {
    const roles = new Set<DogfoodBlockRole>();
    this.#entries.forEach((entry) => roles.add(entry.role));
    return Object.freeze([...roles]);
  }

  forSurface(surfaceId: string): DogfoodBlockRegistryEntry | undefined {
    return this.#entriesBySurfaceId.get(normalizeRequiredText({
      scope: 'dogfood block registry',
      field: 'surfaceId',
      value: surfaceId,
    }));
  }

  forBlock(blockName: string, packageName = DOGFOOD_BLOCK_PACKAGE): DogfoodBlockRegistryEntry | undefined {
    return this.#entriesByBlockKey.get(dogfoodBlockKey(
      normalizeRequiredText({
        scope: 'dogfood block registry',
        field: 'packageName',
        value: packageName,
      }),
      normalizeRequiredText({
        scope: 'dogfood block registry',
        field: 'blockName',
        value: blockName,
      }),
    ));
  }

  with(entry: DogfoodBlockRegistryEntry): DogfoodBlockRegistry {
    return new DogfoodBlockRegistry([...this.#entries, entry]);
  }
}

export function dogfoodBlockRegistryEntry(
  input: DogfoodBlockRegistryEntryInput,
): DogfoodBlockRegistryEntry {
  if (!isBlockDefinition(input.block)) {
    throw new Error('dogfood block registry entry: block was not created by defineBlock()');
  }

  const role = normalizeDogfoodBlockRole(input.role);
  const surfaceId = normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'surfaceId',
    value: input.surfaceId,
  });
  const description = optionalTrimmedText(input.description);
  const tags = Object.freeze((input.tags ?? []).map((tag) => normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'tag',
    value: tag,
  })));

  const entry = {
    block: input.block,
    blockName: input.block.metadata.blockName,
    packageName: input.block.metadata.packageName,
    role,
    surfaceId,
    ...(description === undefined ? {} : { description }),
    tags,
  } as DogfoodBlockRegistryEntry;

  Object.defineProperty(entry, DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND, { value: true });
  return Object.freeze(entry);
}

export function isDogfoodBlockRegistryEntry(
  value: unknown,
): value is DogfoodBlockRegistryEntry {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND)
      && (value as DogfoodBlockRegistryEntryBrandCarrier)[DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND] === true,
  );
}

export function dogfoodBlockRegistry(
  entries: readonly DogfoodBlockRegistryEntry[],
): DogfoodBlockRegistry {
  return new DogfoodBlockRegistry(entries);
}

export function isDogfoodBlockRegistry(value: unknown): value is DogfoodBlockRegistry {
  return Boolean(
    value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, DOGFOOD_BLOCK_REGISTRY_BRAND)
      && (value as DogfoodBlockRegistryBrandCarrier)[DOGFOOD_BLOCK_REGISTRY_BRAND] === true,
  );
}

function dogfoodBlockKey(packageName: string, blockName: string): string {
  return `${packageName}/${blockName}`;
}

function normalizeDogfoodBlockRole(role: DogfoodBlockRole): DogfoodBlockRole {
  const normalized = normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'role',
    value: role,
  }) as DogfoodBlockRole;

  if (!DOGFOOD_BLOCK_ROLES.includes(normalized)) {
    throw new Error(`dogfood block registry entry: unsupported role ${String(role)}`);
  }

  return normalized;
}

function normalizeRequiredText(input: {
  readonly scope: string;
  readonly field: string;
  readonly value: unknown;
}): string {
  if (typeof input.value !== 'string') {
    throw new Error(`${input.scope}: ${input.field} must be a string`);
  }

  const value = input.value.trim();
  if (value === '') {
    throw new Error(`${input.scope}: ${input.field} is required`);
  }

  return value;
}

function optionalTrimmedText(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'description',
    value,
  });
}

const DOGFOOD_BLOCK_ROLES: readonly DogfoodBlockRole[] = Object.freeze([
  'app-shell',
  'title',
  'navigation',
  'article',
  'settings',
  'inspector',
  'preview',
  'workbench',
  'fixture',
]);

interface DogfoodBlockRegistryEntryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]?: true;
}

interface DogfoodBlockRegistryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]?: true;
}
