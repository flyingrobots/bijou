import type { BlockSchemaAdapter } from '../schema-block.js';
import { defineBlockSchemaAdapter } from '../schema-block.js';
import type { ActivityStreamSchemaData, BinaryDecisionSchemaData, BrandEmphasisSchemaData, DenseComparisonSchemaData, DividerSchemaData, ExplorationListSchemaData, ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, HierarchySchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, InspectorPanelSchemaData, LinkDestinationSchemaData, ModeAwarePrimitiveSchemaData, MultipleChoiceSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData, ProgressIndicatorSchemaData, ReaderSurfaceSchemaData, ShortcutCueSchemaData, SingleChoiceSchemaData, TemporalDependencySchemaData, TextEntrySchemaData, TransientOverlaySchemaData } from './types.js';
import { defineStandardSectionSchemaAdapter } from './schema-helpers.js';
import { isInspectorPanelSchemaData, isReaderSurfaceSchemaData, schemaError } from './schema-utils.js';
import { parseActivityStreamSchemaData, parseBinaryDecisionSchemaData, parseDividerSchemaData, parseExplainabilityWalkthroughSchemaData, parseFormattedDocumentSchemaData, parseFramedGroupSchemaData, parseInFlowStatusSchemaData, parseInlineStatusSchemaData, parseLinkDestinationSchemaData, parseMultipleChoiceSchemaData, parseProgressIndicatorSchemaData, parseShortcutCueSchemaData, parseSingleChoiceSchemaData, parseTextEntrySchemaData, parseTransientOverlaySchemaData } from './schema-parsers-core.js';
import { parseBrandEmphasisSchemaData, parseDenseComparisonSchemaData, parseExplorationListSchemaData, parseHierarchySchemaData, parseModeAwarePrimitiveSchemaData, parsePathProgressSchemaData, parsePeerNavigationSchemaData, parseProgressiveDisclosureSchemaData, parseTemporalDependencySchemaData } from './schema-parsers-advanced.js';
import { activityStreamSections, binaryDecisionSections, brandEmphasisSections, denseComparisonSections, dividerSections, explorationListSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, hierarchySections, inFlowStatusSections, inlineStatusSections, linkDestinationSections, modeAwarePrimitiveSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections, progressIndicatorSections, shortcutCueSections, singleChoiceSections, temporalDependencySections, textEntrySections, transientOverlaySections } from './sections.js';

export const readerSurfaceSchemaAdapter: BlockSchemaAdapter<ReaderSurfaceSchemaData> =
  defineBlockSchemaAdapter({
    id: 'reader-surface.article',
    parse(input) {
      if (!isReaderSurfaceSchemaData(input)) {
        return schemaError('reader.article.invalid', 'Reader article data is required.');
      }

      return {
        ok: true,
        data: {
          id: input.id,
          title: input.title,
          body: input.body,
          ...(input.outline === undefined ? {} : { outline: input.outline }),
        },
      };
    },
    describe: () => ({
      requiredFields: ['id', 'title', 'body'],
      optionalFields: ['outline'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'ReaderSurface' }],
    }),
  });

export const inspectorPanelSchemaAdapter: BlockSchemaAdapter<InspectorPanelSchemaData> =
  defineBlockSchemaAdapter({
    id: 'inspector-panel.selection',
    parse(input) {
      if (!isInspectorPanelSchemaData(input)) {
        return schemaError('inspector.selection.invalid', 'Inspector selection data is required.');
      }

      return {
        ok: true,
        data: {
          selectionId: input.selectionId,
          label: input.label,
          ...(input.details === undefined ? {} : { details: input.details }),
        },
      };
    },
    describe: () => ({
      requiredFields: ['selectionId', 'label'],
      optionalFields: ['details'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'InspectorPanel' }],
    }),
  });

export const inlineStatusSchemaAdapter: BlockSchemaAdapter<InlineStatusSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'inline-status.status',
    blockName: 'InlineStatusBlock',
    sections: inlineStatusSections,
    parse: parseInlineStatusSchemaData,
  });

export const inFlowStatusSchemaAdapter: BlockSchemaAdapter<InFlowStatusSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'in-flow-status.status',
    blockName: 'InFlowStatusBlock',
    sections: inFlowStatusSections,
    parse: parseInFlowStatusSchemaData,
  });

export const transientOverlaySchemaAdapter: BlockSchemaAdapter<TransientOverlaySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'transient-overlay.event',
    blockName: 'TransientOverlayBlock',
    sections: transientOverlaySections,
    parse: parseTransientOverlaySchemaData,
  });

export const activityStreamSchemaAdapter: BlockSchemaAdapter<ActivityStreamSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'activity-stream.events',
    blockName: 'ActivityStreamBlock',
    sections: activityStreamSections,
    parse: parseActivityStreamSchemaData,
  });

export const shortcutCueSchemaAdapter: BlockSchemaAdapter<ShortcutCueSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'shortcut-cue.shortcuts',
    blockName: 'ShortcutCueBlock',
    sections: shortcutCueSections,
    parse: parseShortcutCueSchemaData,
  });

export const progressIndicatorSchemaAdapter: BlockSchemaAdapter<ProgressIndicatorSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'progress-indicator.progress',
    blockName: 'ProgressIndicatorBlock',
    sections: progressIndicatorSections,
    parse: parseProgressIndicatorSchemaData,
  });

export const framedGroupSchemaAdapter: BlockSchemaAdapter<FramedGroupSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'framed-group.group',
    blockName: 'FramedGroupBlock',
    sections: framedGroupSections,
    parse: parseFramedGroupSchemaData,
  });

export const explainabilityWalkthroughSchemaAdapter:
  BlockSchemaAdapter<ExplainabilityWalkthroughSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'explainability-walkthrough.walkthrough',
    blockName: 'ExplainabilityWalkthroughBlock',
    sections: explainabilityWalkthroughSections,
    parse: parseExplainabilityWalkthroughSchemaData,
  });

export const formattedDocumentSchemaAdapter: BlockSchemaAdapter<FormattedDocumentSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'formatted-document.document',
    blockName: 'FormattedDocumentBlock',
    sections: formattedDocumentSections,
    parse: parseFormattedDocumentSchemaData,
  });

export const linkDestinationSchemaAdapter: BlockSchemaAdapter<LinkDestinationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'link-destination.link',
    blockName: 'LinkDestinationBlock',
    sections: linkDestinationSections,
    parse: parseLinkDestinationSchemaData,
  });

export const dividerSchemaAdapter: BlockSchemaAdapter<DividerSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'divider.divider',
    blockName: 'DividerBlock',
    sections: dividerSections,
    parse: parseDividerSchemaData,
  });

export const textEntrySchemaAdapter: BlockSchemaAdapter<TextEntrySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'text-entry.entry',
    blockName: 'TextEntryBlock',
    sections: textEntrySections,
    parse: parseTextEntrySchemaData,
  });

export const singleChoiceSchemaAdapter: BlockSchemaAdapter<SingleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'single-choice.choice',
    blockName: 'SingleChoiceBlock',
    sections: singleChoiceSections,
    parse: parseSingleChoiceSchemaData,
  });

export const multipleChoiceSchemaAdapter: BlockSchemaAdapter<MultipleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'multiple-choice.choices',
    blockName: 'MultipleChoiceBlock',
    sections: multipleChoiceSections,
    parse: parseMultipleChoiceSchemaData,
  });

export const binaryDecisionSchemaAdapter: BlockSchemaAdapter<BinaryDecisionSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'binary-decision.decision',
    blockName: 'BinaryDecisionBlock',
    sections: binaryDecisionSections,
    parse: parseBinaryDecisionSchemaData,
  });

export const peerNavigationSchemaAdapter: BlockSchemaAdapter<PeerNavigationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'peer-navigation.peers',
    blockName: 'PeerNavigationBlock',
    sections: peerNavigationSections,
    parse: parsePeerNavigationSchemaData,
  });

export const progressiveDisclosureSchemaAdapter:
  BlockSchemaAdapter<ProgressiveDisclosureSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'progressive-disclosure.disclosure',
    blockName: 'ProgressiveDisclosureBlock',
    sections: progressiveDisclosureSections,
    parse: parseProgressiveDisclosureSchemaData,
  });

export const pathProgressSchemaAdapter: BlockSchemaAdapter<PathProgressSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'path-progress.path',
    blockName: 'PathProgressBlock',
    sections: pathProgressSections,
    parse: parsePathProgressSchemaData,
  });

export const brandEmphasisSchemaAdapter: BlockSchemaAdapter<BrandEmphasisSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'brand-emphasis.brand',
    blockName: 'BrandEmphasisBlock',
    sections: brandEmphasisSections,
    parse: parseBrandEmphasisSchemaData,
  });

export const modeAwarePrimitiveSchemaAdapter: BlockSchemaAdapter<ModeAwarePrimitiveSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'mode-aware-primitive.primitive',
    blockName: 'ModeAwarePrimitiveBlock',
    sections: modeAwarePrimitiveSections,
    parse: parseModeAwarePrimitiveSchemaData,
  });

export const denseComparisonSchemaAdapter: BlockSchemaAdapter<DenseComparisonSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'dense-comparison.comparison',
    blockName: 'DenseComparisonBlock',
    sections: denseComparisonSections,
    parse: parseDenseComparisonSchemaData,
  });

export const hierarchySchemaAdapter: BlockSchemaAdapter<HierarchySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'hierarchy.hierarchy',
    blockName: 'HierarchyBlock',
    sections: hierarchySections,
    parse: parseHierarchySchemaData,
  });

export const explorationListSchemaAdapter: BlockSchemaAdapter<ExplorationListSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'exploration-list.list',
    blockName: 'ExplorationListBlock',
    sections: explorationListSections,
    parse: parseExplorationListSchemaData,
  });

export const temporalDependencySchemaAdapter: BlockSchemaAdapter<TemporalDependencySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'temporal-dependency.timeline',
    blockName: 'TemporalDependencyBlock',
    sections: temporalDependencySections,
    parse: parseTemporalDependencySchemaData,
  });
