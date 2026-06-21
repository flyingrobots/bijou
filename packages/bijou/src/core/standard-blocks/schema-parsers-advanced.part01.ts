import type { BrandEmphasisSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData } from './types.js';

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
