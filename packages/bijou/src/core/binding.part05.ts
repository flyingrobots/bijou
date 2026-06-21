import { DATA_REQUIREMENT_BRAND } from './binding.part01.js';

import type { BindingFact, BindingIssue, BindingStatus, DataRequirement, DataRequirementInput, DeepReadonly, RequirementId } from './binding.part01.js';

import { EMPTY_BINDING_FACTS, EMPTY_BINDING_ISSUES } from './binding.part02.js';

import type { BindingSnapshot } from './binding.part02.js';

import { brand, isBindingSnapshot, normalizeRequiredText, optionalTrimmedText } from './binding.part09.js';

import { freezeFacts } from './binding.part10.js';
export class BindingFrame {
  readonly #snapshotsByRequirementId: ReadonlyMap<RequirementId, BindingSnapshot>;

  constructor(snapshots: readonly BindingSnapshot[]) {
    const snapshotsByRequirementId = new Map<RequirementId, BindingSnapshot>();

    snapshots.forEach((snapshot, index) => {
      if (!isBindingSnapshot(snapshot)) {
        throw new Error(
          `binding frame: snapshot at index ${String(index)} was not created by bindingSnapshot()`,
        );
      }

      if (snapshotsByRequirementId.has(snapshot.requirementId)) {
        throw new Error(`binding frame: duplicate requirement id ${snapshot.requirementId}`);
      }

      snapshotsByRequirementId.set(snapshot.requirementId, snapshot);
    });

    this.#snapshotsByRequirementId = snapshotsByRequirementId;
    Object.freeze(this);
  }

  ids(): readonly RequirementId[] {
    return Object.freeze([...this.#snapshotsByRequirementId.keys()]);
  }

  snapshot<Data = unknown>(requirementId: RequirementId): BindingSnapshot<Data> | undefined;
  snapshot(requirementId: RequirementId): BindingSnapshot | undefined {
    const normalizedRequirementId = normalizeRequiredText({
      scope: 'binding frame',
      field: 'requirementId',
      value: requirementId,
    });

    return this.#snapshotsByRequirementId.get(normalizedRequirementId);
  }

  get<Data = unknown>(requirementId: RequirementId): DeepReadonly<Data> | undefined {
    return this.snapshot<Data>(requirementId)?.data;
  }

  require<Data = unknown>(requirementId: RequirementId): DeepReadonly<Data> {
    const snapshot = this.snapshot<Data>(requirementId);
    if (snapshot === undefined) {
      throw new Error(`binding frame: missing requirement ${requirementId}`);
    }

    if (snapshot.status !== 'ready') {
      throw new Error(`binding frame: requirement ${snapshot.requirementId} is ${snapshot.status}`);
    }

    if (snapshot.data === undefined) {
      throw new Error(`binding frame: requirement ${snapshot.requirementId} has no data`);
    }

    return snapshot.data;
  }

  status(requirementId: RequirementId): BindingStatus | undefined {
    return this.snapshot(requirementId)?.status;
  }

  issues(requirementId: RequirementId): readonly BindingIssue[] {
    return this.snapshot(requirementId)?.issues ?? EMPTY_BINDING_ISSUES;
  }

  facts(requirementId: RequirementId): readonly BindingFact[] {
    return this.snapshot(requirementId)?.facts ?? EMPTY_BINDING_FACTS;
  }
}
export function defineDataRequirement(input: DataRequirementInput): DataRequirement {
  const requirement = {
    id: normalizeRequiredText({
      scope: 'data requirement',
      field: 'id',
      value: input.id,
    }),
    resource: normalizeRequiredText({
      scope: 'data requirement',
      field: 'resource',
      value: input.resource,
    }),
    label: optionalTrimmedText(input.label),
    description: optionalTrimmedText(input.description),
    optional: input.optional,
    facts: freezeFacts(input.facts),
  };

  brand(requirement, DATA_REQUIREMENT_BRAND);
  return Object.freeze(requirement);
}
