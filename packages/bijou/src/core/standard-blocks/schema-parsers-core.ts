import type { ActivityStreamSchemaData, BinaryDecisionSchemaData, DividerSchemaData, ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, LinkDestinationSchemaData, MultipleChoiceSchemaData, ProgressIndicatorSchemaData, ShortcutCueSchemaData, SingleChoiceSchemaData, TextEntrySchemaData, TransientOverlaySchemaData } from './types.js';
import { isPlainRecord, textArrayDataProperty, textDataProperty, textOrNumberDataProperty } from './schema-utils.js';

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
