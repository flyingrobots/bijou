import { defineSchemaBlock } from '../schema-block.js';

import type { SchemaBoundBlockDefinition } from '../schema-block.js';

import type { DividerSchemaData, ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, LinkDestinationSchemaData, MultipleChoiceSchemaData, ProgressIndicatorSchemaData, SingleChoiceSchemaData, TextEntrySchemaData } from './types.js';

import { dividerBlock, explainabilityWalkthroughBlock, formattedDocumentBlock, framedGroupBlock, linkDestinationBlock, multipleChoiceBlock, progressIndicatorBlock, singleChoiceBlock, textEntryBlock } from './block-definitions.js';

import { dividerSchemaAdapter, explainabilityWalkthroughSchemaAdapter, formattedDocumentSchemaAdapter, framedGroupSchemaAdapter, linkDestinationSchemaAdapter, multipleChoiceSchemaAdapter, progressIndicatorSchemaAdapter, singleChoiceSchemaAdapter, textEntrySchemaAdapter } from './schema-adapters.js';

import { bindStandardSectionSchemaData } from './schema-helpers.js';

import { dividerSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, linkDestinationSections, multipleChoiceSections, progressIndicatorSections, singleChoiceSections, textEntrySections } from './sections.js';
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
