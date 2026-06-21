import type { ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, ProgressIndicatorSchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty, textOrNumberDataProperty } from './schema-utils.js';
export function parseProgressIndicatorSchemaData(input: unknown): ProgressIndicatorSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const value = textOrNumberDataProperty(input, 'value');
  const total = textOrNumberDataProperty(input, 'total');
  const percent = textDataProperty(input, 'percent');
  if (label === undefined || percent === undefined) {
    return undefined;
  }

  return {
    label,
    ...(value === undefined ? {} : { value }),
    ...(total === undefined ? {} : { total }),
    percent,
  };
}
export function parseFramedGroupSchemaData(input: unknown): FramedGroupSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const items = textArrayDataProperty(input, 'items');
  const selected = textDataProperty(input, 'selected');
  const mode = textDataProperty(input, 'mode');
  if (title === undefined || items === undefined) {
    return undefined;
  }

  return {
    title,
    items,
    ...(selected === undefined ? {} : { selected }),
    ...(mode === undefined ? {} : { mode }),
  };
}
export function parseExplainabilityWalkthroughSchemaData(
  input: unknown,
): ExplainabilityWalkthroughSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const steps = textArrayDataProperty(input, 'steps');
  const evidence = textDataProperty(input, 'evidence');
  const decision = textDataProperty(input, 'decision');
  const nextStep = textDataProperty(input, 'nextStep');
  if (title === undefined || steps === undefined) {
    return undefined;
  }

  return {
    title,
    steps,
    ...(evidence === undefined ? {} : { evidence }),
    ...(decision === undefined ? {} : { decision }),
    ...(nextStep === undefined ? {} : { nextStep }),
  };
}
export function parseFormattedDocumentSchemaData(input: unknown): FormattedDocumentSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const heading = textDataProperty(input, 'heading');
  const body = textDataProperty(input, 'body');
  const callout = textDataProperty(input, 'callout');
  const code = textDataProperty(input, 'code');
  if (heading === undefined || body === undefined) {
    return undefined;
  }

  return {
    heading,
    body,
    ...(callout === undefined ? {} : { callout }),
    ...(code === undefined ? {} : { code }),
  };
}
