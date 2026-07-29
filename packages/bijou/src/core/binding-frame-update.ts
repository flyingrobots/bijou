import {
  isActiveBindingCollection,
  type ActiveBindingCollection,
} from './active-binding-collection.js';
import {
  bindingFrameFromSnapshots,
  isBindingSnapshot,
  isProviderScope,
  resolveProviderRequirements,
  type BindingFact,
  type BindingFrame,
  type BindingIssue,
  type BindingSnapshot,
  type ProviderResolution,
  type ProviderScope,
} from './binding.js';
import { type BindingLifecycleRecord } from './binding-lifecycle.js';
import {
  bindingLifecycleRecordsForResolvedCollection,
  invalidateUpdatedBindingRecords,
} from './binding-frame-records.js';
import {
  freezeBindingIssues,
  providerAssignmentMismatchIssues,
} from './binding-frame-issues.js';

export interface BindingFrameUpdateFromSnapshotsInput {
  readonly collection: ActiveBindingCollection;
  readonly scope: ProviderScope;
  readonly snapshots: readonly BindingSnapshot[];
  readonly records?: readonly BindingLifecycleRecord[];
}

export interface BindingFrameUpdate {
  readonly frame: BindingFrame;
  readonly records: readonly BindingLifecycleRecord[];
  readonly resolutions: readonly ProviderResolution[];
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}

export function bindingFrameUpdateFromSnapshots(
  input: BindingFrameUpdateFromSnapshotsInput,
): BindingFrameUpdate {
  if (!isObjectRecord(input)) {
    throw new Error('binding frame update: input must be an object');
  }
  if (!isActiveBindingCollection(input.collection)) {
    throw new Error(
      'binding frame update: collection was not created by activeBindingCollection()',
    );
  }
  if (!isProviderScope(input.scope)) {
    throw new Error(
      'binding frame update: scope was not created by providerScope()',
    );
  }
  if (!Array.isArray(input.snapshots)) {
    throw new Error('binding frame update: snapshots must be an array');
  }

  const snapshots = input.snapshots.map((snapshot, index) => {
    if (!isBindingSnapshot(snapshot))
      throw new Error(
        `binding frame update: snapshot ${String(index)} was not created by bindingSnapshot()`,
      );

    return snapshot;
  });

  const resolutions = resolveProviderRequirements(
    input.collection.requirements(),
    input.scope,
  );
  const providerAssignmentMismatches = providerAssignmentMismatchIssues(
    input.collection,
    resolutions,
  );
  const mismatchedRequirementIds = new Set(
    providerAssignmentMismatches.map((issue) => issue.path),
  );
  const effectiveResolutions = resolutions.filter(
    (resolution) => !mismatchedRequirementIds.has(resolution.requirementId),
  );
  const effectiveSnapshots = snapshots.filter(
    (snapshot) => !mismatchedRequirementIds.has(snapshot.requirementId),
  );
  const assembly = bindingFrameFromSnapshots({
    resolutions: effectiveResolutions,
    snapshots: effectiveSnapshots,
  });
  const records = invalidateUpdatedBindingRecords({
    records:
      input.records ??
      bindingLifecycleRecordsForResolvedCollection(
        input.collection,
        resolutions,
      ),
    resolutions: effectiveResolutions,
    snapshots: effectiveSnapshots,
  });

  return Object.freeze({
    frame: assembly.frame,
    records,
    resolutions,
    issues: freezeBindingIssues([
      ...providerAssignmentMismatches,
      ...assembly.issues,
    ]),
    facts: assembly.facts,
  });
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
