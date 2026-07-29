import type { BlockMetadata } from '../block-metadata.js';
import { ALL_OUTPUT_MODES, BIJOU_PACKAGE, type StandardBlockName, type StandardSectionSpec } from './types.js';
import { activityStreamSections, inFlowStatusSections, inlineStatusSections, transientOverlaySections } from './sections.js';

interface StandardSectionMetadataOptions {
  readonly blockName: StandardBlockName;
  readonly family: string;
  readonly scale: BlockMetadata['scale'];
  readonly summary: string;
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly slots: readonly StandardSectionSpec[];
  readonly storyIds: readonly string[];
  readonly composedComponents: readonly string[];
  readonly tags: readonly string[];
  readonly relatedDocs: readonly string[];
}

function firstStandardStoryId(options: StandardSectionMetadataOptions): string {
  const [storyId] = options.storyIds;
  if (typeof storyId !== 'string' || storyId.trim() === '') {
    throw new Error(`${options.blockName} standard metadata requires a story id`);
  }
  return storyId;
}

function standardSectionMetadata(options: StandardSectionMetadataOptions): BlockMetadata {
  const readyStoryId = firstStandardStoryId(options);

  return {
    packageName: BIJOU_PACKAGE,
    blockName: options.blockName,
    family: options.family,
    scale: options.scale,
    modes: ALL_OUTPUT_MODES,
    docs: {
      summary: options.summary,
      useWhen: options.useWhen,
      avoidWhen: options.avoidWhen,
      relatedDocs: options.relatedDocs,
    },
    sourcePath: 'packages/bijou/src/core/standard-blocks.ts',
    slots: options.slots,
    variants: [
      {
        id: 'ready',
        label: 'Ready',
        requiredSlots: options.slots
          .filter((slot) => slot.required)
          .map((slot) => slot.id),
        optionalSlots: options.slots
          .filter((slot) => !slot.required)
          .map((slot) => slot.id),
        facts: [{ kind: 'state', key: 'story.state', value: 'ready' }],
      },
    ],
    composedComponents: options.composedComponents,
    semanticFacts: [{ kind: 'entity', key: 'block', value: options.blockName }],
    storyIds: options.storyIds,
    examples: [{
      id: `${readyStoryId}.example`,
      label: `${options.blockName} ready example`,
    }],
    tags: options.tags,
  };
}

export function inlineStatusMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'InlineStatusBlock',
    family: 'status',
    scale: 'inline',
    summary: 'Attaches concise status facts to labels, rows, and command hints without relying on color-only meaning.',
    useWhen: ['Showing compact status beside a label, command, row, or fact.'],
    avoidWhen: ['The message needs durable body copy, action text, or a review history.'],
    slots: inlineStatusSections,
    storyIds: ['inline-status.ready'],
    composedComponents: ['Badge', 'StatusToken', 'Text'],
    tags: ['standard', 'status', 'inline', 'df-031'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

export function inFlowStatusMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'InFlowStatusBlock',
    family: 'status',
    scale: 'section',
    summary: 'Shows durable in-flow status messages with severity, source, action, and lower-mode facts.',
    useWhen: ['A page needs status copy that remains in the normal reading flow.'],
    avoidWhen: ['The feedback should disappear automatically or interrupt as an overlay.'],
    slots: inFlowStatusSections,
    storyIds: ['in-flow-status.ready'],
    composedComponents: ['Alert', 'Callout', 'StatusToken'],
    tags: ['standard', 'status', 'in-flow', 'df-032'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

export function transientOverlayMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'TransientOverlayBlock',
    family: 'overlay',
    scale: 'overlay',
    summary: 'Announces short-lived state with priority, dismissal, and accessible text facts.',
    useWhen: ['A low-level toast or temporary overlay needs consistent semantics.'],
    avoidWhen: ['The feedback needs durable notification history or blocking confirmation.'],
    slots: transientOverlaySections,
    storyIds: ['transient-overlay.ready'],
    composedComponents: ['Toast', 'OverlayLayer', 'StatusToken'],
    tags: ['standard', 'overlay', 'transient', 'df-033'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

export function activityStreamMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'ActivityStreamBlock',
    family: 'activity',
    scale: 'section',
    summary: 'Renders chronological events with selected-event and lower-mode facts.',
    useWhen: ['A view needs accumulating activity, event history, or release progress logs.'],
    avoidWhen: ['Only one inline status or one temporary overlay is needed.'],
    slots: activityStreamSections,
    storyIds: ['activity-stream.ready'],
    composedComponents: ['Timeline', 'Log', 'StatusToken'],
    tags: ['standard', 'activity', 'timeline', 'df-035'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

export { standardSectionMetadata };
