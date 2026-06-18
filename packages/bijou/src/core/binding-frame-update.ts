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
  if (!isObjectRecord(input)) {
    throw new Error('binding frame update: input must be an object');
  }
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
  const effectiveSnapshots = input.snapshots.filter(
    (snapshot) => !mismatchedRequirementIds.has(snapshot.requirementId),
  );
  const assembly = bindingFrameFromSnapshots({
    resolutions: effectiveResolutions,
    snapshots: effectiveSnapshots,
  });
  const records = invalidateUpdatedRecords({
    records: input.records ?? lifecycleRecordsForResolvedCollection(input.collection, resolutions),
    resolutions: effectiveResolutions,
    snapshots: effectiveSnapshots,
  });

  return Object.freeze({
    frame: assembly.frame,
    records,
    resolutions,
    issues: freezeIssues([
      ...providerAssignmentMismatches,
      ...assembly.issues,
    ]),
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
        || resolution?.providerId === undefined
        || snapshot.providerId !== resolution.providerId
      ) {
        return record;
      }
      if (hasProviderUpdateInvalidation(record, snapshot)) {
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
  return record.invalidations.some((invalidation) => (
    invalidation.reason === 'provider-update'
    && invalidation.providerId === snapshot.providerId
    && invalidation.snapshotVersion === snapshot.version
  ));
}

function providerAssignmentMismatchIssues(
  collection: ActiveBindingCollection,
  resolutions: readonly ProviderResolution[],
): readonly BindingIssue[] {
  const providerIdsByRequirementId = new Map<RequirementId, string>();
  collection.entries().forEach((entry) => {
    if (entry.providerId !== undefined) {
      providerIdsByRequirementId.set(entry.requirement.id, entry.providerId);
    }
  });

  return freezeIssues(resolutions.flatMap((resolution) => {
    const expectedProviderId = providerIdsByRequirementId.get(resolution.requirementId);
    if (
      expectedProviderId === undefined
      || resolution.providerId === undefined
      || resolution.providerId === expectedProviderId
    ) {
      return [];
    }

    return [{
      severity: 'error',
      code: 'provider.assignment-mismatch',
      message:
        `Resolved provider ${resolution.providerId} for requirement `
        + `${resolution.requirementId}; expected ${expectedProviderId}`,
      path: resolution.requirementId,
    } satisfies BindingIssue];
  }));
}

function freezeIssues(issues: readonly BindingIssue[]): readonly BindingIssue[] {
  if (issues.length === 0) {
    return Object.freeze([]);
  }

  return Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
