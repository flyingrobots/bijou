import type { BrandEmphasisSchemaData, DenseComparisonSchemaData, ExplorationListSchemaData, HierarchySchemaData, ModeAwarePrimitiveSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData, TemporalDependencySchemaData } from './types.js';
import { isPlainRecord, textArrayDataProperty, textDataProperty, textOrNumberDataProperty } from './schema-utils.js';

export function parsePeerNavigationSchemaData(input: unknown): PeerNavigationSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const previous = textDataProperty(input, 'previous');
  const current = textDataProperty(input, 'current');
  const next = textDataProperty(input, 'next');
  const route = textDataProperty(input, 'route');
  const status = textDataProperty(input, 'status');
  if (previous === undefined || current === undefined || next === undefined) {
    return undefined;
  }

  return {
    previous,
    current,
    next,
    ...(route === undefined ? {} : { route }),
    ...(status === undefined ? {} : { status }),
  };
}

export function parseProgressiveDisclosureSchemaData(
  input: unknown,
): ProgressiveDisclosureSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const state = textDataProperty(input, 'state');
  const hiddenCount = textOrNumberDataProperty(input, 'hiddenCount');
  const summary = textDataProperty(input, 'summary');
  const details = textArrayDataProperty(input, 'details');
  if (label === undefined || state === undefined || hiddenCount === undefined) {
    return undefined;
  }

  return {
    label,
    state,
    hiddenCount,
    ...(summary === undefined ? {} : { summary }),
    ...(details === undefined ? {} : { details }),
  };
}

export function parsePathProgressSchemaData(input: unknown): PathProgressSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const path = textArrayDataProperty(input, 'path');
  const current = textDataProperty(input, 'current');
  const step = textOrNumberDataProperty(input, 'step');
  const total = textOrNumberDataProperty(input, 'total');
  const status = textDataProperty(input, 'status');
  if (path === undefined || current === undefined || step === undefined || total === undefined) {
    return undefined;
  }

  return {
    path,
    current,
    step,
    total,
    ...(status === undefined ? {} : { status }),
  };
}

export function parseBrandEmphasisSchemaData(input: unknown): BrandEmphasisSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const brand = textDataProperty(input, 'brand');
  const tagline = textDataProperty(input, 'tagline');
  const decoration = textDataProperty(input, 'decoration');
  const role = textDataProperty(input, 'role');
  const selected = textDataProperty(input, 'selected');
  if (brand === undefined || tagline === undefined || decoration === undefined) {
    return undefined;
  }

  return {
    brand,
    tagline,
    decoration,
    ...(role === undefined ? {} : { role }),
    ...(selected === undefined ? {} : { selected }),
  };
}

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
