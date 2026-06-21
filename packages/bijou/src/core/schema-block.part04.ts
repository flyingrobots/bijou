import type { BlockRenderInput } from './block-metadata.js';

import type { BindingFact, DeepReadonly } from './binding.js';

import { deepFreeze, freezeInertData } from './schema-inert-data.js';

import { EMPTY_BINDING_FACTS } from './schema-block.part01.js';

import type { BlockSchemaIssue, SchemaBlockBindOutput } from './schema-block.part01.js';

import type { NormalizedBindOutput } from './schema-block.part03.js';

import { freezeFacts, normalizeIssue, normalizeOutputMode } from './schema-block.part05.js';

import { assertOnlyKeys, isObjectLike, isPlainObject } from './schema-block.part06.js';
export function normalizeBindOutput<Config>(
  output: SchemaBlockBindOutput<Config>,
): NormalizedBindOutput<Config> {
  if (!isObjectLike(output)) {
    throw new Error('schema block bind: bind output must be an object');
  }
  if (!isPlainObject(output)) {
    throw new Error('schema block bind: bind output must be a plain object');
  }

  if (isWrappedBindOutput(output)) {
    const wrappedOutput = output;
    assertOnlyKeys(output, ['input', 'facts'], {
      scope: 'schema block bind',
      label: 'bind output',
    });
    if (!isObjectLike(wrappedOutput.input)) {
      throw new Error('schema block bind: input must be an object');
    }
    if (!isPlainObject(wrappedOutput.input)) {
      throw new Error('schema block bind: input must be a plain object');
    }
    assertOnlyKeys(wrappedOutput.input, ['config', 'slots', 'mode'], {
      scope: 'schema block bind',
      label: 'input',
    });

    return {
      input: freezeRenderInput(wrappedOutput.input),
      facts: freezeFacts(wrappedOutput.facts, 'schema block bind'),
    };
  }

  assertOnlyKeys(output, ['config', 'slots', 'mode'], {
    scope: 'schema block bind',
    label: 'bind output',
  });
  return {
    input: freezeRenderInput(output),
    facts: EMPTY_BINDING_FACTS,
  };
}
export function isWrappedBindOutput<Config>(
  output: SchemaBlockBindOutput<Config>,
): output is {
  readonly input: BlockRenderInput<Config>;
  readonly facts?: readonly BindingFact[];
} {
  return Object.prototype.hasOwnProperty.call(output, 'input');
}
export function freezeRenderInput<Config>(
  input: BlockRenderInput<Config>,
): DeepReadonly<BlockRenderInput<Config>> {
  const normalizedMode = normalizeOutputMode(input.mode);
  const normalizedInput = {
    ...(input.config === undefined
      ? {}
      : { config: freezeInertData(input.config, 'input.config') }),
    ...(input.slots === undefined
      ? {}
      : { slots: freezeInertData(input.slots, 'input.slots') }),
    ...(normalizedMode === undefined ? {} : { mode: normalizedMode }),
  };

  return Object.freeze(normalizedInput);
}
export function freezeSchemaIssues(issues: unknown): readonly BlockSchemaIssue[] {
  if (issues === undefined) {
    throw new Error('block schema result: failed result requires at least one issue');
  }
  if (!Array.isArray(issues)) {
    throw new Error('block schema result: issues must be an array');
  }
  if (issues.length === 0) {
    throw new Error('block schema result: failed result requires at least one issue');
  }

  return deepFreeze(issues.map((issue, index) => normalizeIssue(issue, index)));
}
