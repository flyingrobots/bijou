import { COMMAND_INTENT_BRAND } from './binding.part01.js';

import type { BindingFact, BindingIssue, ProviderResolution, RequirementId } from './binding.part01.js';

import type { BindingFrameAssembly, BindingFrameFromSnapshotsInput, BindingSnapshot, CommandIntent, CommandIntentOptions } from './binding.part02.js';

import { bindingFrame } from './binding.part07.js';

import { brand, freezeIssues, isBindingSnapshot, isProviderResolution, normalizeRequiredText, optionalTrimmedText } from './binding.part09.js';

import { freezeFacts } from './binding.part10.js';
export function bindingFrameFromSnapshots(input: BindingFrameFromSnapshotsInput): BindingFrameAssembly {
  const resolutionsByRequirementId = new Map<RequirementId, ProviderResolution>();
  const snapshotsByRequirementId = new Map<RequirementId, BindingSnapshot>();

  input.resolutions.forEach((resolution, index) => {
    if (!isProviderResolution(resolution)) {
      throw new Error(
        `binding frame assembly: resolution at index ${String(index)} was not created by resolveProviderRequirement()`,
      );
    }
    if (resolutionsByRequirementId.has(resolution.requirementId)) {
      throw new Error(`binding frame assembly: duplicate resolution ${resolution.requirementId}`);
    }

    resolutionsByRequirementId.set(resolution.requirementId, resolution);
  });

  input.snapshots.forEach((snapshot, index) => {
    if (!isBindingSnapshot(snapshot)) {
      throw new Error(
        `binding frame assembly: snapshot at index ${String(index)} was not created by bindingSnapshot()`,
      );
    }
    if (!resolutionsByRequirementId.has(snapshot.requirementId)) {
      throw new Error(`binding frame assembly: snapshot requirement ${snapshot.requirementId} was not resolved`);
    }
    if (snapshotsByRequirementId.has(snapshot.requirementId)) {
      throw new Error(`binding frame assembly: duplicate snapshot ${snapshot.requirementId}`);
    }

    snapshotsByRequirementId.set(snapshot.requirementId, snapshot);
  });

  const frameSnapshots: BindingSnapshot[] = [];
  const issues: BindingIssue[] = [];
  const facts: BindingFact[] = [];

  for (const resolution of resolutionsByRequirementId.values()) {
    facts.push(...resolution.facts);

    if (resolution.status !== 'resolved') {
      issues.push(...resolution.issues);
      continue;
    }

    const snapshot = snapshotsByRequirementId.get(resolution.requirementId);
    if (snapshot === undefined) {
      issues.push({
        severity: 'error',
        code: 'snapshot.missing',
        message: `No snapshot supplied for resolved requirement ${resolution.requirementId}`,
        path: resolution.requirementId,
      });
      continue;
    }

    const expectedProviderId = resolution.providerId;
    if (snapshot.providerId !== expectedProviderId) {
      issues.push({
        severity: 'error',
        code: 'snapshot.provider-mismatch',
        message: `Snapshot for requirement ${resolution.requirementId} came from provider ${snapshot.providerId}; expected ${String(expectedProviderId)}`,
        path: resolution.requirementId,
      });
      continue;
    }

    frameSnapshots.push(snapshot);
    facts.push(...snapshot.facts);
  }

  return Object.freeze({
    frame: bindingFrame(frameSnapshots),
    issues: freezeIssues(issues),
    facts: freezeFacts(facts),
  });
}
export function commandIntent<Payload = unknown>(
  id: string,
  options: CommandIntentOptions = {},
): CommandIntent<Payload> {
  const intent = {
    id: normalizeRequiredText({
      scope: 'command intent',
      field: 'id',
      value: id,
    }),
    label: optionalTrimmedText(options.label),
    description: optionalTrimmedText(options.description),
    facts: freezeFacts(options.facts),
  };

  brand(intent, COMMAND_INTENT_BRAND);
  return Object.freeze(intent);
}
