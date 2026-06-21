import { BINDING_SNAPSHOT_BRAND } from './binding.part01.js';

import type { DataRequirement, ProviderResolution } from './binding.part01.js';

import { EMPTY_BINDING_ISSUES } from './binding.part02.js';

import type { BindingSnapshot, BindingSnapshotInput } from './binding.part02.js';

import type { ProviderScope } from './binding.part04.js';

import { BindingFrame } from './binding.part05.js';

import { isDataRequirement } from './binding.part06.js';

import { brand, freezeIssues, isBindingStatus, normalizeRequiredText } from './binding.part09.js';

import { freezeFacts, freezeSnapshotData, providerResolution } from './binding.part10.js';
export function resolveProviderRequirement(
  requirement: DataRequirement,
  scope: ProviderScope,
): ProviderResolution {
  if (!isDataRequirement(requirement)) {
    throw new Error('provider resolution: requirement was not created by defineDataRequirement()');
  }

  const provider = scope.get(requirement.resource);
  const base = {
    requirementId: requirement.id,
    resource: requirement.resource,
    optional: requirement.optional === true,
    scopeId: scope.id,
    facts: freezeFacts([
      ...requirement.facts,
      ...(provider?.facts ?? []),
    ]),
  };

  if (provider !== undefined) {
    return providerResolution({
      ...base,
      status: 'resolved',
      providerId: provider.id,
      issues: EMPTY_BINDING_ISSUES,
    });
  }

  if (requirement.optional === true) {
    return providerResolution({
      ...base,
      status: 'missing-optional',
      issues: EMPTY_BINDING_ISSUES,
    });
  }

  return providerResolution({
    ...base,
    status: 'missing-required',
    issues: freezeIssues([{
      severity: 'error',
      code: 'provider.missing',
      message: `No provider in scope ${scope.id ?? '<anonymous>'} satisfies resource ${requirement.resource}`,
      path: requirement.id,
    }]),
  });
}
export function resolveProviderRequirements(
  requirements: readonly DataRequirement[],
  scope: ProviderScope,
): readonly ProviderResolution[] {
  return Object.freeze(
    requirements.map((requirement) => resolveProviderRequirement(requirement, scope)),
  );
}
export function bindingSnapshot<Data = unknown>(
  input: BindingSnapshotInput<Data>,
): BindingSnapshot<Data> {
  const providerId = normalizeRequiredText({
    scope: 'binding snapshot',
    field: 'providerId',
    value: input.providerId,
  });
  const requirementId = normalizeRequiredText({
    scope: 'binding snapshot',
    field: 'requirementId',
    value: input.requirementId,
  });
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error('binding snapshot: version must be a positive integer');
  }
  if (!isBindingStatus(input.status)) {
    throw new Error(`binding snapshot: unsupported status ${String(input.status)}`);
  }

  const snapshot = {
    providerId,
    requirementId,
    version: input.version,
    status: input.status,
    ...(input.data === undefined ? {} : { data: freezeSnapshotData(input.data) }),
    issues: freezeIssues(input.issues),
    facts: freezeFacts(input.facts),
  };

  brand(snapshot, BINDING_SNAPSHOT_BRAND);
  return Object.freeze(snapshot);
}
export function bindingFrame(snapshots: readonly BindingSnapshot[]): BindingFrame {
  return new BindingFrame(snapshots);
}
