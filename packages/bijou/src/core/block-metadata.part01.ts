import type { OutputMode } from './detect/tty.js';

import type { ModeLoweringFact } from './mode-lowering.js';

import type { CommandIntent, ViewDataContract } from './binding.js';
export const BLOCK_DEFINITION_BRAND: unique symbol = Symbol('BlockDefinition');
export type BlockScale =
  | 'app'
  | 'section'
  | 'panel'
  | 'control'
  | 'inline'
  | 'item'
  | 'data'
  | 'diagnostic'
  | 'overlay'
  | 'workspace';
export type BlockConfigOptionKind =
  | 'boolean'
  | 'enum'
  | 'number'
  | 'string'
  | 'adapter';
export interface BlockMetadataDocs {
  readonly summary: string;
  readonly useWhen?: readonly string[];
  readonly avoidWhen?: readonly string[];
  readonly relatedDocs?: readonly string[];
}
export interface BlockSlot {
  readonly id: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly description?: string;
}
export interface BlockVariantMetadata {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly requiredSlots?: readonly string[];
  readonly optionalSlots?: readonly string[];
  readonly facts?: readonly ModeLoweringFact[];
}
export interface BlockConfigOption {
  readonly id: string;
  readonly label?: string;
  readonly kind: BlockConfigOptionKind;
  readonly required?: boolean;
  readonly description?: string;
  readonly values?: readonly string[];
}
export interface BlockExample {
  readonly id: string;
  readonly label: string;
  readonly path?: string;
  readonly command?: string;
}
export interface BlockMetadata {
  readonly packageName: string;
  readonly blockName: string;
  readonly family: string;
  readonly scale: BlockScale;
  readonly modes: readonly OutputMode[];
  readonly docs: BlockMetadataDocs;
  readonly sourcePath?: string;
  readonly slots: readonly BlockSlot[];
  readonly variants?: readonly BlockVariantMetadata[];
  readonly configOptions?: readonly BlockConfigOption[];
  readonly composedComponents?: readonly string[];
  readonly semanticFacts?: readonly ModeLoweringFact[];
  readonly storyIds?: readonly string[];
  readonly examples?: readonly BlockExample[];
  readonly tags?: readonly string[];
}
export interface BlockRenderInput<Config = unknown> {
  readonly config?: Config;
  readonly slots?: Readonly<Record<string, unknown>>;
  readonly mode?: OutputMode;
}
export interface BlockRenderResult<Output = unknown> {
  readonly output: Output;
  readonly facts?: readonly ModeLoweringFact[];
}
export interface BlockDefinitionInput<Config = unknown, Output = unknown> {
  readonly metadata: BlockMetadata;
  readonly data?: ViewDataContract;
  readonly commands?: readonly CommandIntent[];
  readonly render: (input: BlockRenderInput<Config>) => BlockRenderResult<Output>;
}
export interface BlockDefinition<Config = unknown, Output = unknown>
  extends BlockDefinitionInput<Config, Output> {
  readonly [BLOCK_DEFINITION_BRAND]: true;
}
