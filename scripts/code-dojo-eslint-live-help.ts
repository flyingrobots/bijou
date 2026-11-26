import { readFileSync } from 'node:fs';

interface SchemaId {
  readonly id: string;
  readonly version: string;
}

const SCHEMA_FILES = ['code-dojo.eslint-live.v1.schema.json', 'code-dojo.eslint-live-event.v1.schema.json'];
const OPTIONS = [
  { flag: '--out <path>', description: 'where to write the live artifact (default .cache/code-dojo/eslint-live.json)' },
  { flag: '--target <glob>', description: 'ESLint target, repeatable (default: the ratchet lint targets)' },
  { flag: '--human', description: 'print prose instead of JSON Lines' },
  { flag: '--schema', description: 'print the schemas and exit 0' },
];

export function helpLine(schema: SchemaId, human: boolean): string {
  if (human) return OPTIONS.map((option) => `${option.flag}  ${option.description}`).join('\n');
  return JSON.stringify({
    _schema: schema,
    kind: 'help',
    command: 'code-dojo:live',
    description: 'Runs the ratchet ESLint analysis and writes a code-dojo.eslint-live.v1 file for code-dojo:report --live-input.',
    options: OPTIONS,
    errors: ['bad-arguments', 'live-failed'],
  });
}

export function schemaLine(schema: SchemaId): string {
  const schemas = SCHEMA_FILES.map((name): unknown => JSON.parse(readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8')));
  return JSON.stringify({ _schema: schema, kind: 'schemas', schemas });
}
