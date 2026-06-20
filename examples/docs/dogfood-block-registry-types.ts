import type { DogfoodBlockDefinition, DogfoodBlockRole } from './dogfood-block-common.js';

export const DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND: unique symbol = Symbol();

export const DOGFOOD_BLOCK_REGISTRY_BRAND: unique symbol = Symbol();

export interface DogfoodBlockRegistryEntryInput {
  readonly block: DogfoodBlockDefinition;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export interface DogfoodBlockRegistryEntry {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]: true;
  readonly block: DogfoodBlockDefinition;
  readonly blockName: string;
  readonly packageName: string;
  readonly role: DogfoodBlockRole;
  readonly surfaceId: string;
  readonly description?: string;
  readonly tags: readonly string[];
}

export interface DogfoodBlockRegistryEntryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_ENTRY_BRAND]?: true;
}

export interface DogfoodBlockRegistryBrandCarrier {
  readonly [DOGFOOD_BLOCK_REGISTRY_BRAND]?: true;
}
