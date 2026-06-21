import type { ExplorationListSchemaData, TemporalDependencySchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty } from './schema-utils.js';
export function parseExplorationListSchemaData(input: unknown): ExplorationListSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const facet = textDataProperty(input, 'facet');
  const items = textArrayDataProperty(input, 'items');
  const selected = textDataProperty(input, 'selected');
  const preview = textDataProperty(input, 'preview');
  if (title === undefined || facet === undefined || items === undefined || selected === undefined) {
    return undefined;
  }

  return {
    title,
    facet,
    items,
    selected,
    ...(preview === undefined ? {} : { preview }),
  };
}
export function parseTemporalDependencySchemaData(
  input: unknown,
): TemporalDependencySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const events = textArrayDataProperty(input, 'events');
  const dependency = textDataProperty(input, 'dependency');
  const selected = textDataProperty(input, 'selected');
  const dependsOn = textDataProperty(input, 'dependsOn');
  if (title === undefined || events === undefined || dependency === undefined) {
    return undefined;
  }

  return {
    title,
    events,
    dependency,
    ...(selected === undefined ? {} : { selected }),
    ...(dependsOn === undefined ? {} : { dependsOn }),
  };
}
