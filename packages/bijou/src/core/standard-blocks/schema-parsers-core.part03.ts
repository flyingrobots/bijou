import type { DividerSchemaData, LinkDestinationSchemaData, SingleChoiceSchemaData, TextEntrySchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty, textOrNumberDataProperty } from './schema-utils.js';
export function parseLinkDestinationSchemaData(input: unknown): LinkDestinationSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const destination = textDataProperty(input, 'destination');
  const kind = textDataProperty(input, 'kind');
  const status = textDataProperty(input, 'status');
  if (label === undefined || destination === undefined) {
    return undefined;
  }

  return {
    label,
    destination,
    ...(kind === undefined ? {} : { kind }),
    ...(status === undefined ? {} : { status }),
  };
}
export function parseDividerSchemaData(input: unknown): DividerSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const style = textDataProperty(input, 'style');
  const density = textDataProperty(input, 'density');
  if (label === undefined) {
    return undefined;
  }

  return {
    label,
    ...(style === undefined ? {} : { style }),
    ...(density === undefined ? {} : { density }),
  };
}
export function parseTextEntrySchemaData(input: unknown): TextEntrySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const field = textDataProperty(input, 'field');
  const value = textDataProperty(input, 'value');
  const placeholder = textDataProperty(input, 'placeholder');
  const validation = textDataProperty(input, 'validation');
  const results = textOrNumberDataProperty(input, 'results');
  if (field === undefined || value === undefined) {
    return undefined;
  }

  return {
    field,
    value,
    ...(placeholder === undefined ? {} : { placeholder }),
    ...(validation === undefined ? {} : { validation }),
    ...(results === undefined ? {} : { results }),
  };
}
export function parseSingleChoiceSchemaData(input: unknown): SingleChoiceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const options = textArrayDataProperty(input, 'options');
  const selected = textDataProperty(input, 'selected');
  const mode = textDataProperty(input, 'mode');
  const validation = textDataProperty(input, 'validation');
  if (label === undefined || options === undefined || selected === undefined) {
    return undefined;
  }

  return {
    label,
    options,
    selected,
    ...(mode === undefined ? {} : { mode }),
    ...(validation === undefined ? {} : { validation }),
  };
}
