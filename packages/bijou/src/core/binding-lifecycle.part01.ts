import type { BindingFact, ProviderId, RequirementId } from './binding.js';
export const BINDING_LIFECYCLE_OWNER_BRAND: unique symbol = Symbol('BindingLifecycleOwner');
export const BINDING_LIFECYCLE_RECORD_BRAND: unique symbol = Symbol('BindingLifecycleRecord');
export type BindingLifecycleState = 'active' | 'suspended' | 'disposed';
export type BindingLifecycleOwnerKind = 'view' | 'block' | 'app-shell' | 'runtime';
export type BindingInvalidationReason =
  | 'provider-update'
  | 'owner-suspended'
  | 'owner-disposed'
  | 'scope-changed'
  | 'manual';
export type BindingLifecycleTransitionReason =
  | 'activate'
  | 'suspend'
  | 'dispose'
  | 'invalidate';
export interface BindingLifecycleOwnerInput {
  readonly id: string;
  readonly kind: string;
  readonly label?: string;
}
export interface BindingLifecycleOwner {
  readonly [BINDING_LIFECYCLE_OWNER_BRAND]: true;
  readonly id: string;
  readonly kind: BindingLifecycleOwnerKind;
  readonly label?: string;
}
export interface BindingInvalidationInput {
  readonly reason: BindingInvalidationReason;
  readonly providerId?: string;
  readonly snapshotVersion?: number;
}
export interface BindingInvalidation {
  readonly requirementId: RequirementId;
  readonly providerId?: ProviderId;
  readonly reason: BindingInvalidationReason;
  readonly snapshotVersion?: number;
}
export interface BindingLifecycleTransition {
  readonly from: BindingLifecycleState;
  readonly to: BindingLifecycleState;
  readonly reason: BindingLifecycleTransitionReason;
}
export interface BindingLifecycleRecordInput {
  readonly owner: BindingLifecycleOwner;
  readonly requirementId: string;
  readonly providerId?: string;
  readonly state?: BindingLifecycleState;
  readonly version?: number;
  readonly invalidations?: readonly BindingInvalidation[];
  readonly transitions?: readonly BindingLifecycleTransition[];
  readonly facts?: readonly BindingFact[];
}
export interface BindingLifecycleRecord {
  readonly [BINDING_LIFECYCLE_RECORD_BRAND]: true;
  readonly owner: BindingLifecycleOwner;
  readonly requirementId: RequirementId;
  readonly providerId?: ProviderId;
  readonly state: BindingLifecycleState;
  readonly version: number;
  readonly invalidations: readonly BindingInvalidation[];
  readonly transitions: readonly BindingLifecycleTransition[];
  readonly facts: readonly BindingFact[];
}
export const BINDING_LIFECYCLE_STATES: readonly BindingLifecycleState[] = [
  'active',
  'suspended',
  'disposed',
];
export const BINDING_LIFECYCLE_OWNER_KINDS: readonly BindingLifecycleOwnerKind[] = [
  'view',
  'block',
  'app-shell',
  'runtime',
];
export const BINDING_INVALIDATION_REASONS: readonly BindingInvalidationReason[] = [
  'provider-update',
  'owner-suspended',
  'owner-disposed',
  'scope-changed',
  'manual',
];
export const BINDING_TRANSITION_REASONS: readonly BindingLifecycleTransitionReason[] = [
  'activate',
  'suspend',
  'dispose',
  'invalidate',
];
export const EMPTY_BINDING_INVALIDATIONS: readonly BindingInvalidation[] = Object.freeze([]);
export const EMPTY_BINDING_TRANSITIONS: readonly BindingLifecycleTransition[] = Object.freeze([]);
export const EMPTY_BINDING_FACTS: readonly BindingFact[] = Object.freeze([]);
