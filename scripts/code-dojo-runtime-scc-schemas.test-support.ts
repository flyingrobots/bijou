import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';

const SCHEMA_DIR = new URL('../schemas/', import.meta.url);
const ajv = new Ajv({ strict: true });

function schema(name: string): object {
  const parsed: unknown = JSON.parse(readFileSync(new URL(name, SCHEMA_DIR), 'utf8'));
  if (parsed == null || typeof parsed !== 'object') throw new Error(`${name} is not a schema object`);
  return parsed;
}

export const validateInventory = ajv.compile(schema('code-dojo.runtime-scc-inventory.v1.schema.json'));
export const validateEvent = ajv.compile(schema('code-dojo.runtime-scc-event.v1.schema.json'));

/** Parses every line as JSON; throws on any line that is not a JSON value. */
export function eventLines(lines: readonly string[]): unknown[] {
  return lines.map((line): unknown => JSON.parse(line));
}
