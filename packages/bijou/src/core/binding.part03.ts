import { VIEW_DATA_CONTRACT_BRAND } from './binding.part01.js';

import type { BindingFact, DataRequirement, RequirementId, ViewDataInput, ViewDataRequirementEntry } from './binding.part01.js';

import { isDataRequirement } from './binding.part06.js';

import { normalizeRequiredText, optionalTrimmedText } from './binding.part09.js';

import { freezeFacts } from './binding.part10.js';
export class ViewDataContract {
  readonly [VIEW_DATA_CONTRACT_BRAND] = true;
  readonly #entriesByName: ReadonlyMap<string, ViewDataRequirementEntry>;
  readonly #entriesByRequirementId: ReadonlyMap<RequirementId, ViewDataRequirementEntry>;
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly facts: readonly BindingFact[];

  constructor(input: ViewDataInput) {
    const entriesByName = new Map<string, ViewDataRequirementEntry>();
    const entriesByRequirementId = new Map<RequirementId, ViewDataRequirementEntry>();

    input.requirements.forEach((entry) => {
      const name = normalizeRequiredText({
        scope: 'view data',
        field: 'requirement name',
        value: entry.name,
      });
      if (!isDataRequirement(entry.requirement)) {
        throw new Error(`view data: requirement ${name} was not created by defineDataRequirement()`);
      }
      if (entriesByName.has(name)) {
        throw new Error(`view data: duplicate requirement name ${name}`);
      }
      if (entriesByRequirementId.has(entry.requirement.id)) {
        throw new Error(`view data: duplicate requirement id ${entry.requirement.id}`);
      }

      const normalizedEntry = Object.freeze({
        name,
        requirement: entry.requirement,
      });
      entriesByName.set(name, normalizedEntry);
      entriesByRequirementId.set(entry.requirement.id, normalizedEntry);
    });

    this.#entriesByName = entriesByName;
    this.#entriesByRequirementId = entriesByRequirementId;
    this.id = optionalTrimmedText(input.id);
    this.label = optionalTrimmedText(input.label);
    this.description = optionalTrimmedText(input.description);
    this.facts = freezeFacts(input.facts);
    Object.freeze(this);
  }

  names(): readonly string[] {
    return Object.freeze([...this.#entriesByName.keys()]);
  }

  requirementIds(): readonly RequirementId[] {
    return Object.freeze([...this.#entriesByRequirementId.keys()]);
  }

  entries(): readonly ViewDataRequirementEntry[] {
    return Object.freeze([...this.#entriesByName.values()]);
  }

  requirements(): readonly DataRequirement[] {
    return Object.freeze(this.entries().map((entry) => entry.requirement));
  }

  entry(name: string): ViewDataRequirementEntry | undefined {
    const normalizedName = normalizeRequiredText({
      scope: 'view data',
      field: 'requirement name',
      value: name,
    });

    return this.#entriesByName.get(normalizedName);
  }

  requirement(name: string): DataRequirement | undefined {
    return this.entry(name)?.requirement;
  }
}
