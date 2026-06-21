import { defineBlockSchemaAdapter } from '../schema-block.js';

import type { BlockSchemaAdapter } from '../schema-block.js';

import type { ActivityStreamSchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, InspectorPanelSchemaData, ProgressIndicatorSchemaData, ReaderSurfaceSchemaData, ShortcutCueSchemaData, TransientOverlaySchemaData } from './types.js';

import { defineStandardSectionSchemaAdapter } from './schema-helpers.js';

import { isInspectorPanelSchemaData, isReaderSurfaceSchemaData, schemaError } from './schema-utils.js';

import { parseActivityStreamSchemaData, parseInFlowStatusSchemaData, parseInlineStatusSchemaData, parseProgressIndicatorSchemaData, parseShortcutCueSchemaData, parseTransientOverlaySchemaData } from './schema-parsers-core.js';

import { activityStreamSections, inFlowStatusSections, inlineStatusSections, progressIndicatorSections, shortcutCueSections, transientOverlaySections } from './sections.js';
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
