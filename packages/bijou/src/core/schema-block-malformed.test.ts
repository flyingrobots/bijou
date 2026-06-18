import { describe, expect, it } from 'vitest';
import { defineBlockSchemaAdapter, parseBlockSchema } from './schema-block.js';

interface Value {
  readonly value: string;
}

describe('schema block malformed adapter results', () => {
  it.each([
    ['truthy ok', truthyMalformedResult],
    ['falsy ok', falsyMalformedResult],
  ])('rejects %s discriminants', (_name, buildResult) => {
    const adapter = defineBlockSchemaAdapter<Value>({
      id: 'malformed-result',
      parse: buildResult,
    });

    expect(() => parseBlockSchema(adapter, {})).toThrow('block schema result: ok must be true or false');
  });
});

function truthyMalformedResult(): { readonly ok: true; readonly data: Value } {
  const result = { ok: true as const, data: { value: 'bad' } };
  Object.defineProperty(result, 'ok', { value: 'false' });
  return result;
}

function falsyMalformedResult(): {
  readonly ok: false;
  readonly issues: readonly [{ readonly severity: 'error'; readonly code: string; readonly message: string }];
} {
  const result = {
    ok: false as const,
    issues: [{ severity: 'error' as const, code: 'malformed', message: 'Malformed.' }] as const,
  };
  Object.defineProperty(result, 'ok', { value: 0 });
  return result;
}
