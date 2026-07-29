import type { ActiveBindingCollection } from './active-binding-collection.js';
import {
  type BindingSnapshot,
  type ProviderResolution,
  type RequirementId,
} from './binding.js';
import {
  bindingLifecycleRecord,
  invalidateBinding,
  isBindingLifecycleRecord,
  type BindingLifecycleRecord,
} from './binding-lifecycle.js';

export function bindingLifecycleRecordsForResolvedCollection(
  collection: ActiveBindingCollection,
  resolutions: readonly ProviderResolution[],
): readonly BindingLifecycleRecord[] {
  const resolutionsByRequirement = new Map<RequirementId, ProviderResolution>();
  for (const resolution of resolutions) {
    resolutionsByRequirement.set(resolution.requirementId, resolution);
  }
  return Object.freeze(
    collection.entries().map((entry) => {
      const resolution = resolutionsByRequirement.get(entry.requirement.id);
      return bindingLifecycleRecord({
        owner: entry.owner,
        requirementId: entry.requirement.id,
        providerId: entry.providerId ?? resolution?.providerId,
        facts: entry.requirement.facts,
      });
    }),
  );
}

export function invalidateUpdatedBindingRecords(options: {
  readonly records: readonly BindingLifecycleRecord[];
  readonly resolutions: readonly ProviderResolution[];
  readonly snapshots: readonly BindingSnapshot[];
}): readonly BindingLifecycleRecord[] {
  if (!Array.isArray(options.records)) {
    throw new Error('binding frame update: records must be an array');
  }
  const resolutions = new Map<RequirementId, ProviderResolution>();
  for (const resolution of options.resolutions) {
    resolutions.set(resolution.requirementId, resolution);
  }
  const snapshots = new Map<RequirementId, BindingSnapshot>();
  for (const snapshot of options.snapshots) {
    snapshots.set(snapshot.requirementId, snapshot);
  }

  return Object.freeze(
    options.records.map((record, index) => {
      if (!isBindingLifecycleRecord(record)) {
        throw new Error(
          `binding frame update: record ${String(index)} was not created by bindingLifecycleRecord()`,
        );
      }
      const snapshot = snapshots.get(record.requirementId);
      const resolution = resolutions.get(record.requirementId);
      if (
        snapshot === undefined ||
        resolution?.providerId === undefined ||
        snapshot.providerId !== resolution.providerId ||
        hasProviderUpdateInvalidation(record, snapshot)
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

function hasProviderUpdateInvalidation(
  record: BindingLifecycleRecord,
  snapshot: BindingSnapshot,
): boolean {
  return record.invalidations.some(
    (invalidation) =>
      invalidation.reason === 'provider-update' &&
      invalidation.providerId === snapshot.providerId &&
      invalidation.snapshotVersion === snapshot.version,
  );
}
