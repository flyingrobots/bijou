import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { buildRuntimeImportGraph, isRuntimeGraphSource } from './code-dojo-runtime-import-graph.js';
import { buildRuntimeSccInventory, inventoryOf, serializeRuntimeSccInventory, type RuntimeSccInventory } from './code-dojo-runtime-scc.js';
import { helpEvents, humanLine, schemaEvents, type RuntimeSccEvent } from './code-dojo-runtime-scc-help.js';
import { inventoryInconsistencies, parseRuntimeSccInventory } from './code-dojo-runtime-scc-inventory.js';
import { compareRuntimeSccInventories } from './code-dojo-runtime-scc-ratchet.js';

export const RUNTIME_SCC_INVENTORY_PATH = 'scripts/code-dojo/baselines/runtime-scc.json';
const EVENT_SCHEMA = { id: 'code-dojo.runtime-scc-event', version: '1.0.0' };
const FLAGS = new Set(['--check', '--write', '--accept-growth', '--human', '--help', '--schema']);

export interface RuntimeSccRun {
  readonly code: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}

interface Outcome {
  readonly code: number;
  readonly events: readonly RuntimeSccEvent[];
}

class SccError extends Error {
  constructor(readonly reason: string, message: string) {
    super(message);
  }
}

const isFailure = (event: RuntimeSccEvent): boolean => event.kind === 'violation' || event.kind === 'error';

/** Tracked and untracked, non-ignored sources: the tree the next commit would hold. */
function workspaceSources(root: string): readonly string[] {
  const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  });
  return listed.split('\0').filter((file) => isRuntimeGraphSource(file) && existsSync(join(root, file)));
}

function readBaseline(root: string, writing: boolean): RuntimeSccInventory {
  const path = join(root, RUNTIME_SCC_INVENTORY_PATH);
  if (!existsSync(path)) {
    if (writing) return inventoryOf([]);
    throw new SccError('inventory-missing', `${RUNTIME_SCC_INVENTORY_PATH} does not exist; run npm run code-dojo:cycles:write`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new SccError('inventory-invalid', `${RUNTIME_SCC_INVENTORY_PATH} is not JSON`);
  }
  const inventory = parseRuntimeSccInventory(parsed);
  const problems = typeof inventory === 'string' ? [inventory] : inventoryInconsistencies(inventory);
  if (typeof inventory === 'string' || problems.length > 0) {
    throw new SccError('inventory-invalid', `${RUNTIME_SCC_INVENTORY_PATH}: ${problems.join('; ')}`);
  }
  return inventory;
}

function analyse(root: string, args: ReadonlySet<string>): Outcome {
  const writing = args.has('--write');
  const started = performance.now();
  const files = workspaceSources(root);
  const graph = buildRuntimeImportGraph({ files, read: (file) => readFileSync(join(root, file), 'utf8') });
  const current = buildRuntimeSccInventory(graph);
  const built: RuntimeSccEvent = {
    kind: 'graph-built',
    files: graph.size,
    edges: [...graph.values()].reduce((sum, targets) => sum + targets.length, 0),
    componentCount: current.componentCount,
    moduleCount: current.moduleCount,
    elapsedMs: Math.round(performance.now() - started),
  };
  const violations = compareRuntimeSccInventories(readBaseline(root, writing), current)
    .map((violation): RuntimeSccEvent => ({ kind: 'violation', ...violation }));
  const text = serializeRuntimeSccInventory(current);
  const counts = { path: RUNTIME_SCC_INVENTORY_PATH, componentCount: current.componentCount, moduleCount: current.moduleCount };
  if (writing) {
    if (violations.length > 0 && !args.has('--accept-growth')) {
      return failed([built, ...violations], 'growth-not-accepted', 'the inventory would grow; fix the cycle, or pass --accept-growth with design-review justification');
    }
    mkdirSync(dirname(join(root, RUNTIME_SCC_INVENTORY_PATH)), { recursive: true });
    writeFileSync(join(root, RUNTIME_SCC_INVENTORY_PATH), text);
    return { code: 0, events: [built, { kind: 'inventory-written', ...counts, acceptedViolations: violations.length }] };
  }
  if (violations.length > 0) {
    return failed([built, ...violations], 'ratchet-failed', `${String(violations.length)} runtime import cycle violation(s); remove the new cycle edges`);
  }
  if (readFileSync(join(root, RUNTIME_SCC_INVENTORY_PATH), 'utf8') !== text) {
    return failed([built], 'inventory-stale', `${RUNTIME_SCC_INVENTORY_PATH} is stale (a cycle shrank or disappeared); run npm run code-dojo:cycles:write`);
  }
  return { code: 0, events: [built, { kind: 'inventory-current', ...counts }] };
}

function failed(events: readonly RuntimeSccEvent[], code: string, message: string): Outcome {
  return { code: 1, events: [...events, { kind: 'error', code, message }] };
}

function execute(argv: readonly string[], root: string): Outcome {
  const args = new Set(argv);
  const unknown = argv.filter((arg) => !FLAGS.has(arg));
  if (unknown.length > 0) throw new SccError('bad-arguments', `unknown argument(s): ${unknown.join(' ')}`);
  if (args.has('--check') && args.has('--write')) throw new SccError('bad-arguments', '--check and --write are exclusive');
  if (args.has('--accept-growth') && !args.has('--write')) throw new SccError('bad-arguments', '--accept-growth requires --write');
  if (args.has('--help')) return { code: 0, events: helpEvents() };
  if (args.has('--schema')) return { code: 0, events: schemaEvents() };
  return analyse(root, args);
}

/** Never throws: every failure becomes a schema'd error line on stderr. */
export function runRuntimeScc(argv: readonly string[], root: string): RuntimeSccRun {
  let outcome: Outcome;
  try {
    outcome = execute(argv, root);
  } catch (error) {
    const code = error instanceof SccError ? error.reason : 'scc-failed';
    const message = error instanceof Error ? error.message : 'unknown failure';
    outcome = failed([], code, message);
  }
  const render = (event: RuntimeSccEvent): string =>
    argv.includes('--human') ? humanLine(event) : JSON.stringify({ _schema: EVENT_SCHEMA, ...event });
  return {
    code: outcome.code,
    stdout: outcome.events.filter((event) => !isFailure(event)).map(render),
    stderr: outcome.events.filter(isFailure).map(render),
  };
}
