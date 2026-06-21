import type { ModeLoweringFact } from './mode-lowering.js';
export const DATA_REQUIREMENT_BRAND: unique symbol = Symbol('DataRequirement');
export const DATA_PROVIDER_BRAND: unique symbol = Symbol('DataProvider');
export const VIEW_DATA_CONTRACT_BRAND: unique symbol = Symbol('ViewDataContract');
export const BINDING_SNAPSHOT_BRAND: unique symbol = Symbol('BindingSnapshot');
export const PROVIDER_SCOPE_ENTRY_BRAND: unique symbol = Symbol('ProviderScopeEntry');
export const PROVIDER_SCOPE_BRAND: unique symbol = Symbol('ProviderScope');
export const PROVIDER_RESOLUTION_BRAND: unique symbol = Symbol('ProviderResolution');
export const COMMAND_INTENT_BRAND: unique symbol = Symbol('CommandIntent');
export const COMMAND_INTENT_PAYLOAD: unique symbol = Symbol('CommandIntentPayload');
export type ProviderId = string;
export type RequirementId = string;
export type CommandIntentId = string;
export type BindingStatus = 'ready' | 'loading' | 'empty' | 'stale' | 'error';
export type BindingIssueSeverity = 'info' | 'warning' | 'error';
export type ProviderResolutionStatus = 'resolved' | 'missing-optional' | 'missing-required';
export type BindingFact = ModeLoweringFact;
export type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;
export interface BindingIssue {
  readonly severity: BindingIssueSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
export interface DataRequirementInput {
  readonly id: string;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly facts?: readonly BindingFact[];
}
export interface DataRequirement {
  readonly [DATA_REQUIREMENT_BRAND]: true;
  readonly id: RequirementId;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly facts: readonly BindingFact[];
}
export interface DataProviderInput {
  readonly id: string;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}
export interface DataProvider {
  readonly [DATA_PROVIDER_BRAND]: true;
  readonly id: ProviderId;
  readonly resource: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];
}
export interface ViewDataRequirementEntry {
  readonly name: string;
  readonly requirement: DataRequirement;
}
export interface ViewDataInput {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly requirements: readonly ViewDataRequirementEntry[];
  readonly facts?: readonly BindingFact[];
}
export interface ProviderScopeEntry {
  readonly [PROVIDER_SCOPE_ENTRY_BRAND]: true;
  readonly resource: string;
  readonly provider: DataProvider;
}
export interface ProviderScopeOptions {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}
export interface ProviderResolution {
  readonly [PROVIDER_RESOLUTION_BRAND]: true;
  readonly requirementId: RequirementId;
  readonly resource: string;
  readonly optional: boolean;
  readonly status: ProviderResolutionStatus;
  readonly scopeId?: string;
  readonly providerId?: ProviderId;
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}
