import { defineSchemaBlock } from '../schema-block.js';

import type { SchemaBoundBlockDefinition } from '../schema-block.js';

import type { ActivityStreamSchemaData, InFlowStatusSchemaData, InlineStatusSchemaData, InspectorPanelSchemaData, ReaderSurfaceSchemaData, ShortcutCueSchemaData, TransientOverlaySchemaData } from './types.js';

import { activityStreamBlock, inFlowStatusBlock, inlineStatusBlock, inspectorPanelBlock, readerSurfaceBlock, shortcutCueBlock, transientOverlayBlock } from './block-definitions.js';

import { activityStreamSchemaAdapter, inFlowStatusSchemaAdapter, inlineStatusSchemaAdapter, inspectorPanelSchemaAdapter, readerSurfaceSchemaAdapter, shortcutCueSchemaAdapter, transientOverlaySchemaAdapter } from './schema-adapters.js';

import { bindStandardSectionSchemaData } from './schema-helpers.js';

import { activityStreamSections, inFlowStatusSections, inlineStatusSections, shortcutCueSections, transientOverlaySections } from './sections.js';
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
