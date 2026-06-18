import { defineBlockSchemaAdapter, type BlockSchemaAdapter } from '../schema-block.js';
import type { BindingFact, DeepReadonly } from '../binding.js';
import type { StandardBlockName, StandardSectionSpec } from './types.js';
import { standardBlockKey } from './sections.js';
import { schemaError, ownDataProperty } from './schema-utils.js';
import { slotValueText } from './render.js';

interface StandardSectionSchemaAdapterOptions<Data extends object> {
  readonly id: string;
  readonly blockName: StandardBlockName;
  readonly sections: readonly StandardSectionSpec[];
  readonly parse: (input: unknown) => Data | undefined;
}

export function defineStandardSectionSchemaAdapter<Data extends object>(
  options: StandardSectionSchemaAdapterOptions<Data>,
): BlockSchemaAdapter<Data> {
  return defineBlockSchemaAdapter({
    id: options.id,
    parse(input) {
      const data = options.parse(input);
      if (data === undefined) {
        return schemaError(
          `${standardBlockKey(options.blockName)}.data.invalid`,
          `${options.blockName} data is required.`,
        );
      }

      return {
        ok: true,
        data: data as DeepReadonly<Data>,
      };
    },
    describe: () => ({
      requiredFields: options.sections
        .filter((section) => section.required)
        .map((section) => section.id),
      optionalFields: options.sections
        .filter((section) => !section.required)
        .map((section) => section.id),
      facts: [{ kind: 'entity', key: 'block.schema', value: options.blockName }],
    }),
  });
}

export function bindStandardSectionSchemaData(
  blockName: StandardBlockName,
  data: Readonly<Record<string, unknown>>,
  sections: readonly StandardSectionSpec[],
) {
  const slots: Record<string, unknown> = {};
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block.schema', value: blockName },
  ];

  for (const section of sections) {
    const value = ownDataProperty(data as Record<string, unknown>, section.id);
    if (value === undefined) {
      continue;
    }

    slots[section.id] = value;
    const text = slotValueText(value);
    if (text !== undefined) {
      facts.push({ kind: 'label', key: `semanticValue.${section.id}`, value: text });
    }
  }

  return {
    input: { slots },
    facts,
  };
}
