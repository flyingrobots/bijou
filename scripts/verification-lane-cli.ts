import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifyChanges, requiredPolicy, type ChangedPath, type LaneDecision } from './verification-lane-classify.js';
import { changedPathsSince, DEFAULT_BASE_REF, LaneInputError, mergeBase, parsePathList } from './verification-lane-git.js';

export const LANE_EVENT_SCHEMA: { readonly id: string; readonly version: string } = { id: 'bijou.verify-lane.event', version: '1.0.0' };
export const LANE_EVENT_SCHEMA_PATH = 'schemas/bijou.verify-lane.event.v1.schema.json';

export interface LaneIo {
  /** Repository root: the working directory for git and for relative `--paths-from` files. */
  readonly cwd: string;
  /** Reads a `--paths-from` source; `-` is standard input. */
  readonly readText: (source: string) => string;
  /** `$GITHUB_OUTPUT`, when running in GitHub Actions. */
  readonly githubOutput: string | null;
}

export interface LaneRun {
  readonly code: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}

const OPTIONS = [
  { flag: '--base <ref>', description: `Classify the diff from the merge base of <ref> and HEAD to HEAD (default ${DEFAULT_BASE_REF}).` },
  { flag: '--paths-from <file|->', description: 'Classify a list instead of a git diff: bare paths or git diff --name-status lines.' },
  { flag: '--json', description: 'Accepted for the DL-030 interface; JSON Lines is already the default.' },
  { flag: '--human', description: 'Print prose ending with lane=<fast|full> dogfood=<true|false>.' },
  { flag: '--schema', description: 'Print the JSON Schema for every line this command emits.' },
  { flag: '--help', description: 'Print this description as a JSON line.' },
];
const FLAGS = new Set(['--json', '--human', '--humanize', '--schema', '--help']);
const VALUED = new Set(['--base', '--paths-from']);

function line(fields: Record<string, unknown>): string {
  return JSON.stringify({ _schema: LANE_EVENT_SCHEMA, ...fields });
}

function parseArgs(args: readonly string[]): { flags: Set<string>; values: Map<string, string> } {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    if (FLAGS.has(arg)) {
      flags.add(arg === '--humanize' ? '--human' : arg);
    } else if (VALUED.has(arg)) {
      const value = args[index + 1];
      if (value == null || (value.startsWith('--') && value !== '-')) throw new LaneInputError('bad-arguments', `${arg} requires a value`);
      values.set(arg, value);
      index += 1;
    } else {
      throw new LaneInputError('bad-arguments', `unknown argument: ${arg}`);
    }
  }
  if (values.has('--base') && values.has('--paths-from')) throw new LaneInputError('bad-arguments', '--base and --paths-from are exclusive');
  return { flags, values };
}

function humanLines(decision: LaneDecision, base: string | null): string[] {
  const header = base == null ? 'verify:lane: classified a path list' : `verify:lane: classified the diff from ${base} to HEAD`;
  const rows = decision.reasons.map((entry) => {
    const escalated = entry.escalation == null ? '' : ` [escalated: ${entry.escalation}]`;
    return `  ${entry.lane}  ${entry.reason}  ${entry.path} (pattern ${entry.pattern})${escalated}`;
  });
  return [header, ...rows, `required policy ${requiredPolicy(decision.lane)}`, `lane=${decision.lane} dogfood=${String(decision.dogfood)}`];
}

function writeGithubOutput(io: LaneIo, lane: string, dogfood: boolean): void {
  if (io.githubOutput != null && io.githubOutput !== '') appendFileSync(io.githubOutput, `lane=${lane}\ndogfood=${String(dogfood)}\n`);
}

function execute(args: readonly string[], io: LaneIo): LaneRun {
  const { flags, values } = parseArgs(args);
  if (flags.has('--help')) {
    const description = 'Classifies changed paths into the fast or full verification lane (DL-030). Unknown paths, deletions, renames and errors are full.';
    return { code: 0, stdout: [line({ kind: 'help', command: 'verify:lane', description, options: OPTIONS, schema: LANE_EVENT_SCHEMA_PATH })], stderr: [] };
  }
  if (flags.has('--schema')) {
    const schema: unknown = JSON.parse(readFileSync(resolve(io.cwd, LANE_EVENT_SCHEMA_PATH), 'utf8'));
    return { code: 0, stdout: [line({ kind: 'schema', schema })], stderr: [] };
  }
  const source = values.get('--paths-from');
  let base: string | null = null;
  let changes: ChangedPath[];
  if (source == null) {
    base = mergeBase(io.cwd, values.get('--base') ?? DEFAULT_BASE_REF);
    changes = changedPathsSince(io.cwd, base);
  } else {
    let text: string;
    try {
      text = io.readText(source === '-' ? '-' : resolve(io.cwd, source));
    } catch (error) {
      throw new LaneInputError('unreadable-paths', `cannot read ${source}: ${error instanceof Error ? error.message : 'unknown failure'}`);
    }
    changes = parsePathList(text);
  }
  const decision = classifyChanges(changes);
  writeGithubOutput(io, decision.lane, decision.dogfood);
  const stdout = flags.has('--human')
    ? humanLines(decision, base)
    : [line({ kind: 'lane-decision', ...decision, requiredPolicy: requiredPolicy(decision.lane), base })];
  return { code: 0, stdout, stderr: [] };
}

/** Never throws: every failure is an error line that still says `lane: full`, and a non-zero exit. */
export function runVerificationLane(args: readonly string[], io: LaneIo): LaneRun {
  try {
    return execute(args, io);
  } catch (error) {
    const code = error instanceof LaneInputError ? error.code : 'classification-failed';
    const message = error instanceof Error ? error.message : 'unknown failure';
    try {
      writeGithubOutput(io, 'full', true);
    } catch {
      // The error line below still reports lane full and the exit is non-zero.
    }
    const human = args.includes('--human') || args.includes('--humanize');
    const stderr = human ? [`verify:lane: ${code}: ${message}`, 'lane=full dogfood=true'] : [line({ kind: 'error', code, message, lane: 'full', dogfood: true })];
    return { code: 1, stdout: [], stderr };
  }
}
