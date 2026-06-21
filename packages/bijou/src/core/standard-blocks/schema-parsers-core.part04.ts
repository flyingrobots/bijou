import type { BinaryDecisionSchemaData, MultipleChoiceSchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty } from './schema-utils.js';
export function parseMultipleChoiceSchemaData(input: unknown): MultipleChoiceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const checked = textArrayDataProperty(input, 'checked');
  const unchecked = textArrayDataProperty(input, 'unchecked');
  const selected = textDataProperty(input, 'selected');
  const validation = textDataProperty(input, 'validation');
  if (label === undefined || checked === undefined || unchecked === undefined) {
    return undefined;
  }

  return {
    label,
    checked,
    unchecked,
    ...(selected === undefined ? {} : { selected }),
    ...(validation === undefined ? {} : { validation }),
  };
}
export function parseBinaryDecisionSchemaData(input: unknown): BinaryDecisionSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const selected = textDataProperty(input, 'selected');
  const consequence = textDataProperty(input, 'consequence');
  const confirmation = textDataProperty(input, 'confirmation');
  const disabledReason = textDataProperty(input, 'disabledReason');
  if (label === undefined || selected === undefined || consequence === undefined) {
    return undefined;
  }

  return {
    label,
    selected,
    consequence,
    ...(confirmation === undefined ? {} : { confirmation }),
    ...(disabledReason === undefined ? {} : { disabledReason }),
  };
}
