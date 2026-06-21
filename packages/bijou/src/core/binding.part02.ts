import type { BINDING_SNAPSHOT_BRAND, BindingFact, BindingIssue, BindingIssueSeverity, BindingStatus, COMMAND_INTENT_BRAND, COMMAND_INTENT_PAYLOAD, CommandIntentId, DeepReadonly, ProviderId, ProviderResolution, RequirementId } from './binding.part01.js';

import type { BindingFrame } from './binding.part05.js';
export interface BindingSnapshotInput<Data = unknown> {
  readonly providerId: string;
  readonly requirementId: string;
  readonly version: number;
  readonly status: BindingStatus;
  readonly data?: Data;
  readonly issues?: readonly BindingIssue[];
  readonly facts?: readonly BindingFact[];
}
export interface BindingSnapshot<Data = unknown> {
  readonly [BINDING_SNAPSHOT_BRAND]: true;
  readonly providerId: ProviderId;
  readonly requirementId: RequirementId;
  readonly version: number;
  readonly status: BindingStatus;
  readonly data?: DeepReadonly<Data>;
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}
export interface BindingFrameFromSnapshotsInput {
  readonly resolutions: readonly ProviderResolution[];
  readonly snapshots: readonly BindingSnapshot[];
}
export interface BindingFrameAssembly {
  readonly frame: BindingFrame;
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}
export interface CommandIntentOptions {
  readonly label?: string;
  readonly description?: string;
  readonly facts?: readonly BindingFact[];
}
export interface CommandIntent<Payload = unknown> {
  readonly [COMMAND_INTENT_BRAND]: true;
  readonly [COMMAND_INTENT_PAYLOAD]?: Payload;
  readonly id: CommandIntentId;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];
}
export const BINDING_STATUSES: readonly BindingStatus[] = [
  'ready',
  'loading',
  'empty',
  'stale',
  'error',
];
export const BINDING_STATUS_VALUES: ReadonlySet<string> = new Set(BINDING_STATUSES);
export const BINDING_ISSUE_SEVERITIES: readonly BindingIssueSeverity[] = [
  'info',
  'warning',
  'error',
];
export const BINDING_ISSUE_SEVERITY_VALUES: ReadonlySet<string> = new Set(BINDING_ISSUE_SEVERITIES);
export const EMPTY_BINDING_ISSUES = Object.freeze([]) as readonly BindingIssue[];
export const EMPTY_BINDING_FACTS = Object.freeze([]) as readonly BindingFact[];
