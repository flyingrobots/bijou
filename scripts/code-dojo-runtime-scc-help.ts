import { readFileSync } from 'node:fs';

/** One output line before the `_schema` envelope is added. */
export type RuntimeSccEvent = Readonly<Record<string, unknown>> & { readonly kind: string };

const SCHEMAS = ['code-dojo.runtime-scc-inventory.v1', 'code-dojo.runtime-scc-event.v1'];

const OPTIONS = [
  ['--check', 'Default. Fail on a new, grown or merged component or a new internal edge, and on a stale inventory.'],
  ['--write', 'Regenerate the inventory. Refuses to record growth.'],
  ['--accept-growth', 'With --write, record growth anyway. Needs design-review justification.'],
  ['--human', 'Print prose instead of JSON Lines.'],
  ['--help', 'Describe the command and print its schemas.'],
  ['--schema', 'Print the inventory and event JSON Schemas.'],
];

export function schemaEvents(): RuntimeSccEvent[] {
  return SCHEMAS.map((name) => {
    const schema: unknown = JSON.parse(readFileSync(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'));
    return { kind: 'schema', name, schema };
  });
}

export function helpEvents(): RuntimeSccEvent[] {
  return [{
    kind: 'help',
    command: 'npm run code-dojo:cycles',
    description: 'Hold-or-shrink ratchet on the strongly connected components of the repository runtime import graph.',
    usage: 'tsx scripts/code-dojo-runtime-scc-gate.ts [--check | --write [--accept-growth]] [--human]',
    options: OPTIONS.map(([flag = '', text = '']) => ({ flag, description: text })),
  }, ...schemaEvents()];
}

const text = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value));

/** Prose for one event, for `--human`. */
export function humanLine(event: RuntimeSccEvent): string {
  switch (event.kind) {
    case 'graph-built':
      return `runtime import graph: ${text(event['files'])} files, ${text(event['edges'])} edges, ${text(event['componentCount'])} cyclic components (${text(event['elapsedMs'])} ms)`;
    case 'inventory-current':
      return `runtime SCC inventory current: ${text(event['componentCount'])} components, ${text(event['moduleCount'])} modules`;
    case 'inventory-written':
      return `runtime SCC inventory written to ${text(event['path'])}: ${text(event['componentCount'])} components, ${text(event['moduleCount'])} modules`;
    case 'violation':
      return `violation ${text(event['code'])} in ${text(event['component'])}: added modules ${text(event['addedModules'])}, added edges ${text(event['addedEdges'])}`;
    case 'error':
      return `error ${text(event['code'])}: ${text(event['message'])}`;
    case 'help':
      return `${text(event['command'])}: ${text(event['description'])}\nusage: ${text(event['usage'])}`;
    default:
      return `${event.kind}: ${JSON.stringify(event)}`;
  }
}
