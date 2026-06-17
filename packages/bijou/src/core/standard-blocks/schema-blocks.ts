import { defineSchemaBlock, type SchemaBoundBlockDefinition } from '../schema-block.js';
import type { ActivityStreamSchemaData, BinaryDecisionSchemaData, BrandEmphasisSchemaData, DenseComparisonSchemaData, DividerSchemaData, ExplorationListSchemaData, ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, HierarchySchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, InspectorPanelSchemaData, LinkDestinationSchemaData, ModeAwarePrimitiveSchemaData, MultipleChoiceSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData, ProgressIndicatorSchemaData, ReaderSurfaceSchemaData, ShortcutCueSchemaData, SingleChoiceSchemaData, TemporalDependencySchemaData, TextEntrySchemaData, TransientOverlaySchemaData } from './types.js';
import { activityStreamBlock, binaryDecisionBlock, brandEmphasisBlock, denseComparisonBlock, dividerBlock, explorationListBlock, explainabilityWalkthroughBlock, formattedDocumentBlock, framedGroupBlock, hierarchyBlock, inFlowStatusBlock, inlineStatusBlock, inspectorPanelBlock, linkDestinationBlock, modeAwarePrimitiveBlock, multipleChoiceBlock, pathProgressBlock, peerNavigationBlock, progressiveDisclosureBlock, progressIndicatorBlock, readerSurfaceBlock, shortcutCueBlock, singleChoiceBlock, temporalDependencyBlock, textEntryBlock, transientOverlayBlock } from './block-definitions.js';
import { activityStreamSchemaAdapter, binaryDecisionSchemaAdapter, brandEmphasisSchemaAdapter, denseComparisonSchemaAdapter, dividerSchemaAdapter, explorationListSchemaAdapter, explainabilityWalkthroughSchemaAdapter, formattedDocumentSchemaAdapter, framedGroupSchemaAdapter, hierarchySchemaAdapter, inFlowStatusSchemaAdapter, inlineStatusSchemaAdapter, inspectorPanelSchemaAdapter, linkDestinationSchemaAdapter, modeAwarePrimitiveSchemaAdapter, multipleChoiceSchemaAdapter, pathProgressSchemaAdapter, peerNavigationSchemaAdapter, progressiveDisclosureSchemaAdapter, progressIndicatorSchemaAdapter, readerSurfaceSchemaAdapter, shortcutCueSchemaAdapter, singleChoiceSchemaAdapter, temporalDependencySchemaAdapter, textEntrySchemaAdapter, transientOverlaySchemaAdapter } from './schema-adapters.js';
import { bindStandardSectionSchemaData } from './schema-helpers.js';
import { activityStreamSections, binaryDecisionSections, brandEmphasisSections, denseComparisonSections, dividerSections, explorationListSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, hierarchySections, inFlowStatusSections, inlineStatusSections, linkDestinationSections, modeAwarePrimitiveSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections, progressIndicatorSections, shortcutCueSections, singleChoiceSections, temporalDependencySections, textEntrySections, transientOverlaySections } from './sections.js';

export const readerSurfaceSchemaBlock: SchemaBoundBlockDefinition<ReaderSurfaceSchemaData> =
  defineSchemaBlock({
    block: readerSurfaceBlock,
    schema: readerSurfaceSchemaAdapter,
    bind: (article) => ({
      input: {
        slots: {
          content: article.body,
          ...(article.outline === undefined
            ? {}
            : { outline: article.outline.map((item) => item.label) }),
        },
      },
      facts: [
        { kind: 'entity', key: 'article', value: article.id },
        { kind: 'label', key: 'article.title', value: article.title },
      ],
    }),
  });

export const inspectorPanelSchemaBlock: SchemaBoundBlockDefinition<InspectorPanelSchemaData> =
  defineSchemaBlock({
    block: inspectorPanelBlock,
    schema: inspectorPanelSchemaAdapter,
    bind: (selection) => ({
      input: {
        slots: {
          selection: selection.label,
          ...(selection.details === undefined ? {} : { details: selection.details }),
        },
      },
      facts: [
        { kind: 'entity', key: 'selection', value: selection.selectionId },
        { kind: 'label', key: 'selection.label', value: selection.label },
      ],
    }),
  });

export const inlineStatusSchemaBlock: SchemaBoundBlockDefinition<InlineStatusSchemaData> =
  defineSchemaBlock({
    block: inlineStatusBlock,
    schema: inlineStatusSchemaAdapter,
    bind: (status) => bindStandardSectionSchemaData(
      'InlineStatusBlock',
      status as Readonly<Record<string, unknown>>,
      inlineStatusSections,
    ),
  });

export const inFlowStatusSchemaBlock: SchemaBoundBlockDefinition<InFlowStatusSchemaData> =
  defineSchemaBlock({
    block: inFlowStatusBlock,
    schema: inFlowStatusSchemaAdapter,
    bind: (status) => bindStandardSectionSchemaData(
      'InFlowStatusBlock',
      status as Readonly<Record<string, unknown>>,
      inFlowStatusSections,
    ),
  });

export const transientOverlaySchemaBlock: SchemaBoundBlockDefinition<TransientOverlaySchemaData> =
  defineSchemaBlock({
    block: transientOverlayBlock,
    schema: transientOverlaySchemaAdapter,
    bind: (overlay) => bindStandardSectionSchemaData(
      'TransientOverlayBlock',
      overlay as Readonly<Record<string, unknown>>,
      transientOverlaySections,
    ),
  });

export const activityStreamSchemaBlock: SchemaBoundBlockDefinition<ActivityStreamSchemaData> =
  defineSchemaBlock({
    block: activityStreamBlock,
    schema: activityStreamSchemaAdapter,
    bind: (stream) => bindStandardSectionSchemaData(
      'ActivityStreamBlock',
      stream as Readonly<Record<string, unknown>>,
      activityStreamSections,
    ),
  });

export const shortcutCueSchemaBlock: SchemaBoundBlockDefinition<ShortcutCueSchemaData> =
  defineSchemaBlock({
    block: shortcutCueBlock,
    schema: shortcutCueSchemaAdapter,
    bind: (cue) => bindStandardSectionSchemaData(
      'ShortcutCueBlock',
      cue as Readonly<Record<string, unknown>>,
      shortcutCueSections,
    ),
  });

export const progressIndicatorSchemaBlock: SchemaBoundBlockDefinition<ProgressIndicatorSchemaData> =
  defineSchemaBlock({
    block: progressIndicatorBlock,
    schema: progressIndicatorSchemaAdapter,
    bind: (progress) => bindStandardSectionSchemaData(
      'ProgressIndicatorBlock',
      progress as Readonly<Record<string, unknown>>,
      progressIndicatorSections,
    ),
  });

export const framedGroupSchemaBlock: SchemaBoundBlockDefinition<FramedGroupSchemaData> =
  defineSchemaBlock({
    block: framedGroupBlock,
    schema: framedGroupSchemaAdapter,
    bind: (group) => bindStandardSectionSchemaData(
      'FramedGroupBlock',
      group as Readonly<Record<string, unknown>>,
      framedGroupSections,
    ),
  });

export const explainabilityWalkthroughSchemaBlock:
  SchemaBoundBlockDefinition<ExplainabilityWalkthroughSchemaData> =
  defineSchemaBlock({
    block: explainabilityWalkthroughBlock,
    schema: explainabilityWalkthroughSchemaAdapter,
    bind: (walkthrough) => bindStandardSectionSchemaData(
      'ExplainabilityWalkthroughBlock',
      walkthrough as Readonly<Record<string, unknown>>,
      explainabilityWalkthroughSections,
    ),
  });

export const formattedDocumentSchemaBlock: SchemaBoundBlockDefinition<FormattedDocumentSchemaData> =
  defineSchemaBlock({
    block: formattedDocumentBlock,
    schema: formattedDocumentSchemaAdapter,
    bind: (document) => bindStandardSectionSchemaData(
      'FormattedDocumentBlock',
      document as Readonly<Record<string, unknown>>,
      formattedDocumentSections,
    ),
  });

export const linkDestinationSchemaBlock: SchemaBoundBlockDefinition<LinkDestinationSchemaData> =
  defineSchemaBlock({
    block: linkDestinationBlock,
    schema: linkDestinationSchemaAdapter,
    bind: (link) => bindStandardSectionSchemaData(
      'LinkDestinationBlock',
      link as Readonly<Record<string, unknown>>,
      linkDestinationSections,
    ),
  });

export const dividerSchemaBlock: SchemaBoundBlockDefinition<DividerSchemaData> =
  defineSchemaBlock({
    block: dividerBlock,
    schema: dividerSchemaAdapter,
    bind: (divider) => bindStandardSectionSchemaData(
      'DividerBlock',
      divider as Readonly<Record<string, unknown>>,
      dividerSections,
    ),
  });

export const textEntrySchemaBlock: SchemaBoundBlockDefinition<TextEntrySchemaData> =
  defineSchemaBlock({
    block: textEntryBlock,
    schema: textEntrySchemaAdapter,
    bind: (entry) => bindStandardSectionSchemaData(
      'TextEntryBlock',
      entry as Readonly<Record<string, unknown>>,
      textEntrySections,
    ),
  });

export const singleChoiceSchemaBlock: SchemaBoundBlockDefinition<SingleChoiceSchemaData> =
  defineSchemaBlock({
    block: singleChoiceBlock,
    schema: singleChoiceSchemaAdapter,
    bind: (choice) => bindStandardSectionSchemaData(
      'SingleChoiceBlock',
      choice as Readonly<Record<string, unknown>>,
      singleChoiceSections,
    ),
  });

export const multipleChoiceSchemaBlock: SchemaBoundBlockDefinition<MultipleChoiceSchemaData> =
  defineSchemaBlock({
    block: multipleChoiceBlock,
    schema: multipleChoiceSchemaAdapter,
    bind: (choices) => bindStandardSectionSchemaData(
      'MultipleChoiceBlock',
      choices as Readonly<Record<string, unknown>>,
      multipleChoiceSections,
    ),
  });

export const binaryDecisionSchemaBlock: SchemaBoundBlockDefinition<BinaryDecisionSchemaData> =
  defineSchemaBlock({
    block: binaryDecisionBlock,
    schema: binaryDecisionSchemaAdapter,
    bind: (decision) => bindStandardSectionSchemaData(
      'BinaryDecisionBlock',
      decision as Readonly<Record<string, unknown>>,
      binaryDecisionSections,
    ),
  });

export const peerNavigationSchemaBlock: SchemaBoundBlockDefinition<PeerNavigationSchemaData> =
  defineSchemaBlock({
    block: peerNavigationBlock,
    schema: peerNavigationSchemaAdapter,
    bind: (peers) => bindStandardSectionSchemaData(
      'PeerNavigationBlock',
      peers as Readonly<Record<string, unknown>>,
      peerNavigationSections,
    ),
  });

export const progressiveDisclosureSchemaBlock:
  SchemaBoundBlockDefinition<ProgressiveDisclosureSchemaData> =
  defineSchemaBlock({
    block: progressiveDisclosureBlock,
    schema: progressiveDisclosureSchemaAdapter,
    bind: (disclosure) => bindStandardSectionSchemaData(
      'ProgressiveDisclosureBlock',
      disclosure as Readonly<Record<string, unknown>>,
      progressiveDisclosureSections,
    ),
  });

export const pathProgressSchemaBlock: SchemaBoundBlockDefinition<PathProgressSchemaData> =
  defineSchemaBlock({
    block: pathProgressBlock,
    schema: pathProgressSchemaAdapter,
    bind: (path) => bindStandardSectionSchemaData(
      'PathProgressBlock',
      path as Readonly<Record<string, unknown>>,
      pathProgressSections,
    ),
  });

export const brandEmphasisSchemaBlock: SchemaBoundBlockDefinition<BrandEmphasisSchemaData> =
  defineSchemaBlock({
    block: brandEmphasisBlock,
    schema: brandEmphasisSchemaAdapter,
    bind: (brand) => bindStandardSectionSchemaData(
      'BrandEmphasisBlock',
      brand as Readonly<Record<string, unknown>>,
      brandEmphasisSections,
    ),
  });

export const modeAwarePrimitiveSchemaBlock:
  SchemaBoundBlockDefinition<ModeAwarePrimitiveSchemaData> =
  defineSchemaBlock({
    block: modeAwarePrimitiveBlock,
    schema: modeAwarePrimitiveSchemaAdapter,
    bind: (primitive) => bindStandardSectionSchemaData(
      'ModeAwarePrimitiveBlock',
      primitive as Readonly<Record<string, unknown>>,
      modeAwarePrimitiveSections,
    ),
  });

export const denseComparisonSchemaBlock: SchemaBoundBlockDefinition<DenseComparisonSchemaData> =
  defineSchemaBlock({
    block: denseComparisonBlock,
    schema: denseComparisonSchemaAdapter,
    bind: (comparison) => bindStandardSectionSchemaData(
      'DenseComparisonBlock',
      comparison as Readonly<Record<string, unknown>>,
      denseComparisonSections,
    ),
  });

export const hierarchySchemaBlock: SchemaBoundBlockDefinition<HierarchySchemaData> =
  defineSchemaBlock({
    block: hierarchyBlock,
    schema: hierarchySchemaAdapter,
    bind: (hierarchy) => bindStandardSectionSchemaData(
      'HierarchyBlock',
      hierarchy as Readonly<Record<string, unknown>>,
      hierarchySections,
    ),
  });

export const explorationListSchemaBlock: SchemaBoundBlockDefinition<ExplorationListSchemaData> =
  defineSchemaBlock({
    block: explorationListBlock,
    schema: explorationListSchemaAdapter,
    bind: (list) => bindStandardSectionSchemaData(
      'ExplorationListBlock',
      list as Readonly<Record<string, unknown>>,
      explorationListSections,
    ),
  });

export const temporalDependencySchemaBlock:
  SchemaBoundBlockDefinition<TemporalDependencySchemaData> =
  defineSchemaBlock({
    block: temporalDependencyBlock,
    schema: temporalDependencySchemaAdapter,
    bind: (timeline) => bindStandardSectionSchemaData(
      'TemporalDependencyBlock',
      timeline as Readonly<Record<string, unknown>>,
      temporalDependencySections,
    ),
  });
