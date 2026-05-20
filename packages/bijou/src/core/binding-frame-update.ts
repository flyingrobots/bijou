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
  type RequirementId,
} from './binding.js';
import {
  bindingLifecycleRecord,
  invalidateBinding,
  isBindingLifecycleRecord,
  type BindingLifecycleRecord,
} from './binding-lifecycle.js';

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
  if (!isActiveBindingCollection(input.collection)) {
    throw new Error(
      'binding frame update: collection was not created by activeBindingCollection()',
    );
  }
  if (!isProviderScope(input.scope)) {
    throw new Error('binding frame update: scope was not created by providerScope()');
  }
  if (!Array.isArray(input.snapshots)) {
    throw new Error('binding frame update: snapshots must be an array');
  }

  input.snapshots.forEach((snapshot, index) => {
    if (!isBindingSnapshot(snapshot)) {
      throw new Error(
        `binding frame update: snapshot at index ${index} was not created by bindingSnapshot()`,
      );
    }
  });

  const resolutions = resolveProviderRequirements(input.collection.requirements(), input.scope);
  const assembly = bindingFrameFromSnapshots({
    resolutions,
    snapshots: input.snapshots,
  });
  const records = invalidateUpdatedRecords({
    records: input.records ?? lifecycleRecordsForResolvedCollection(input.collection, resolutions),
    resolutions,
    snapshots: input.snapshots,
  });

  return Object.freeze({
    frame: assembly.frame,
    records,
    resolutions,
    issues: assembly.issues,
    facts: assembly.facts,
  });
}

function lifecycleRecordsForResolvedCollection(
  collection: ActiveBindingCollection,
  resolutions: readonly ProviderResolution[],
): readonly BindingLifecycleRecord[] {
  const resolutionsByRequirementId = new Map<RequirementId, ProviderResolution>();
  resolutions.forEach((resolution) => {
    resolutionsByRequirementId.set(resolution.requirementId, resolution);
  });

  return Object.freeze(
    collection.entries().map((entry) => {
      const resolution = resolutionsByRequirementId.get(entry.requirement.id);

      return bindingLifecycleRecord({
        owner: entry.owner,
        requirementId: entry.requirement.id,
        providerId: entry.providerId ?? resolution?.providerId,
        facts: entry.requirement.facts,
      });
    }),
  );
}

function invalidateUpdatedRecords(options: {
  readonly records: readonly BindingLifecycleRecord[];
  readonly resolutions: readonly ProviderResolution[];
  readonly snapshots: readonly BindingSnapshot[];
}): readonly BindingLifecycleRecord[] {
  if (!Array.isArray(options.records)) {
    throw new Error('binding frame update: records must be an array');
  }

  const resolutionsByRequirementId = new Map<RequirementId, ProviderResolution>();
  options.resolutions.forEach((resolution) => {
    resolutionsByRequirementId.set(resolution.requirementId, resolution);
  });
  const snapshotsByRequirementId = new Map<RequirementId, BindingSnapshot>();
  options.snapshots.forEach((snapshot) => {
    snapshotsByRequirementId.set(snapshot.requirementId, snapshot);
  });

  return Object.freeze(
    options.records.map((record, index) => {
      if (!isBindingLifecycleRecord(record)) {
        throw new Error(
          `binding frame update: record at index ${index} was not created by bindingLifecycleRecord()`,
        );
      }

      const snapshot = snapshotsByRequirementId.get(record.requirementId);
      const resolution = resolutionsByRequirementId.get(record.requirementId);
      if (
        snapshot === undefined
        || resolution === undefined
        || resolution.providerId === undefined
        || snapshot.providerId !== resolution.providerId
      ) {
        return record;
      }

      return invalidateBinding(record, {
        reason: 'provider-update',
        providerId: snapshot.providerId,
        snapshotVersion: snapshot.version,
      });
    }),
  );
}
