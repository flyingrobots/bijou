import { isBlockDefinition } from '@flyingrobots/bijou';
import { DOGFOOD_BLOCK_ROLES } from './dogfood-block-common.js';
import type { DogfoodBlockRole } from './dogfood-block-common.js';
import { DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND } from './dogfood-block-registry-types.js';
import type {
  DogfoodBlockRegistryEntry,
  DogfoodBlockRegistryEntryBrandCarrier,
  DogfoodBlockRegistryEntryInput,
} from './dogfood-block-registry-types.js';
import { normalizeRequiredText, optionalTrimmedText } from './dogfood-block-text.js';

export function dogfoodBlockRegistryEntry(
  input: DogfoodBlockRegistryEntryInput,
): DogfoodBlockRegistryEntry {
  const candidateBlock: unknown = input.block;
  if (!isBlockDefinition(candidateBlock)) {
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

  const entry: DogfoodBlockRegistryEntry = {
    [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]: true,
    block: input.block,
    blockName: input.block.metadata.blockName,
    packageName: input.block.metadata.packageName,
    role,
    surfaceId,
    ...(description === undefined ? {} : { description }),
    tags,
  };

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

export function normalizeDogfoodBlockRole(role: DogfoodBlockRole): DogfoodBlockRole {
  const value = normalizeRequiredText({
    scope: 'dogfood block registry entry',
    field: 'role',
    value: role,
  });

  const known = DOGFOOD_BLOCK_ROLES.find((item) => item === value);
  if (known === undefined) {
    throw new Error(`dogfood block registry entry: unsupported role ${role}`);
  }

  return known;
}
