import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { lintTargets, runEslintJson } from './code-dojo/eslint-results.mjs';
import { buildEslintLive } from './code-dojo-eslint-live-build.js';
import { helpLine, schemaLine } from './code-dojo-eslint-live-help.js';

export const DEFAULT_LIVE_PATH = '.cache/code-dojo/eslint-live.json';
const EVENT_SCHEMA = { id: 'code-dojo.eslint-live-event', version: '1.0.0' };
const FLAGS = new Set(['--out', '--target', '--human', '--humanize', '--help', '--schema']);

export interface CodeDojoLiveRun {
  readonly code: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}

class LiveError extends Error {
  constructor(readonly reason: string, message: string) {
    super(message);
  }
}

function parse(args: readonly string[]): { out: string; targets: string[] } {
  const targets: string[] = [];
  let out = DEFAULT_LIVE_PATH;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    if (!FLAGS.has(arg)) throw new LiveError('bad-arguments', `unknown option ${arg}`);
    if (arg !== '--out' && arg !== '--target') continue;
    const value = args[index + 1];
    if (value == null || value.startsWith('--')) throw new LiveError('bad-arguments', `${arg} requires a value`);
    if (arg === '--out') out = value;
    else targets.push(value);
    index += 1;
  }
  return { out, targets: targets.length > 0 ? targets : [...lintTargets] };
}

function storedEslintTotal(root: string): number {
  const parsed: unknown = JSON.parse(readFileSync(resolve(root, 'scripts/code-dojo/baselines/eslint.json'), 'utf8'));
  const total: unknown = parsed != null && typeof parsed === 'object' && 'total' in parsed ? parsed.total : null;
  if (typeof total !== 'number' || !Number.isInteger(total) || total < 0) throw new LiveError('live-failed', 'eslint baseline has no valid total');
  return total;
}

function execute(args: readonly string[], root: string, human: boolean): string[] {
  if (args.includes('--help')) return [helpLine(EVENT_SCHEMA, human)];
  if (args.includes('--schema')) return [schemaLine(EVENT_SCHEMA)];
  const { out, targets } = parse(args);
  const stored = storedEslintTotal(root);
  const live = buildEslintLive(runEslintJson(root, targets), root);
  const target = resolve(root, out);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(live, null, 2)}\n`);
  const slack = stored - live.eslintViolations;
  const done = {
    kind: 'live-written', path: out, stored, live: live.eslintViolations, slack,
    nextCeiling: Math.min(stored, live.eslintViolations), files: live.eslintFiles.length,
  };
  if (!human) return [JSON.stringify({ _schema: EVENT_SCHEMA, ...done })];
  return [
    `Code Dojo live ESLint: stored ${String(stored)}, live ${String(done.live)}, slack ${String(slack)}`,
    `Next legal ceiling: ${String(done.nextCeiling)}. Wrote ${out}`,
  ];
}

/** Never throws: every failure becomes a schema'd error line on stderr. */
export function runCodeDojoEslintLive(args: readonly string[], root: string): CodeDojoLiveRun {
  const human = args.includes('--human') || args.includes('--humanize');
  try {
    return { code: 0, stdout: execute(args, root, human), stderr: [] };
  } catch (error) {
    const reason = error instanceof LiveError ? error.reason : 'live-failed';
    const message = error instanceof Error ? error.message : 'unknown failure';
    const text = human ? `error (${reason}): ${message}` : JSON.stringify({ _schema: EVENT_SCHEMA, kind: 'error', code: reason, message });
    return { code: 1, stdout: [], stderr: [text] };
  }
}
