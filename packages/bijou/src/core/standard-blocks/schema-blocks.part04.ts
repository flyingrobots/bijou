import { defineSchemaBlock } from '../schema-block.js';

import type { SchemaBoundBlockDefinition } from '../schema-block.js';

import type { TemporalDependencySchemaData } from './types.js';

import { temporalDependencyBlock } from './block-definitions.js';

import { temporalDependencySchemaAdapter } from './schema-adapters.js';

import { bindStandardSectionSchemaData } from './schema-helpers.js';

import { temporalDependencySections } from './sections.js';
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
