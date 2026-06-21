import type { DenseComparisonSchemaData, HierarchySchemaData, ModeAwarePrimitiveSchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty, textOrNumberDataProperty } from './schema-utils.js';
export function parseModeAwarePrimitiveSchemaData(
  input: unknown,
): ModeAwarePrimitiveSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const primitive = textDataProperty(input, 'primitive');
  const fact = textDataProperty(input, 'fact');
  const value = textOrNumberDataProperty(input, 'value');
  const status = textDataProperty(input, 'status');
  const modeContract = textDataProperty(input, 'modeContract');
  const selected = textDataProperty(input, 'selected');
  if (primitive === undefined || fact === undefined || value === undefined) {
    return undefined;
  }

  return {
    primitive,
    fact,
    value,
    ...(status === undefined ? {} : { status }),
    ...(modeContract === undefined ? {} : { modeContract }),
    ...(selected === undefined ? {} : { selected }),
  };
}
export function parseDenseComparisonSchemaData(input: unknown): DenseComparisonSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const metric = textDataProperty(input, 'metric');
  const left = textOrNumberDataProperty(input, 'left');
  const right = textOrNumberDataProperty(input, 'right');
  const delta = textOrNumberDataProperty(input, 'delta');
  const selected = textDataProperty(input, 'selected');
  if (
    title === undefined
    || metric === undefined
    || left === undefined
    || right === undefined
    || delta === undefined
  ) {
    return undefined;
  }

  return {
    title,
    metric,
    left,
    right,
    delta,
    ...(selected === undefined ? {} : { selected }),
  };
}
export function parseHierarchySchemaData(input: unknown): HierarchySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const root = textDataProperty(input, 'root');
  const nodes = textArrayDataProperty(input, 'nodes');
  const selected = textDataProperty(input, 'selected');
  const parent = textDataProperty(input, 'parent');
  const depth = textOrNumberDataProperty(input, 'depth');
  const expanded = textDataProperty(input, 'expanded');
  if (root === undefined || nodes === undefined || selected === undefined) {
    return undefined;
  }

  return {
    root,
    nodes,
    selected,
    ...(parent === undefined ? {} : { parent }),
    ...(depth === undefined ? {} : { depth }),
    ...(expanded === undefined ? {} : { expanded }),
  };
}
