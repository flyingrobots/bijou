import type { ActivityStreamSchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, ShortcutCueSchemaData, TransientOverlaySchemaData } from './types.js';

import { isPlainRecord, textArrayDataProperty, textDataProperty } from './schema-utils.js';
export function parseInlineStatusSchemaData(input: unknown): InlineStatusSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const status = textDataProperty(input, 'status');
  const message = textDataProperty(input, 'message');
  if (label === undefined || status === undefined) {
    return undefined;
  }

  return {
    label,
    status,
    ...(message === undefined ? {} : { message }),
  };
}
export function parseInFlowStatusSchemaData(input: unknown): InFlowStatusSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const severity = textDataProperty(input, 'severity');
  const source = textDataProperty(input, 'source');
  const message = textDataProperty(input, 'message');
  const action = textDataProperty(input, 'action');
  if (severity === undefined || message === undefined) {
    return undefined;
  }

  return {
    severity,
    ...(source === undefined ? {} : { source }),
    message,
    ...(action === undefined ? {} : { action }),
  };
}
export function parseTransientOverlaySchemaData(input: unknown): TransientOverlaySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const priority = textDataProperty(input, 'priority');
  const message = textDataProperty(input, 'message');
  const dismiss = textDataProperty(input, 'dismiss');
  if (message === undefined) {
    return undefined;
  }

  return {
    ...(priority === undefined ? {} : { priority }),
    message,
    ...(dismiss === undefined ? {} : { dismiss }),
  };
}
export function parseActivityStreamSchemaData(input: unknown): ActivityStreamSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const events = textArrayDataProperty(input, 'events');
  const selected = textDataProperty(input, 'selected');
  if (events === undefined) {
    return undefined;
  }

  return {
    events,
    ...(selected === undefined ? {} : { selected }),
  };
}
export function parseShortcutCueSchemaData(input: unknown): ShortcutCueSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const shortcuts = textArrayDataProperty(input, 'shortcuts');
  const scope = textDataProperty(input, 'scope');
  if (shortcuts === undefined) {
    return undefined;
  }

  return {
    shortcuts,
    ...(scope === undefined ? {} : { scope }),
  };
}
