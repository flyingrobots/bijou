// The full-suite job of the CI workflow (flyingrobots/bijou#907): shards 1 to N of N.

/** The job that runs the full suite as shards 1 to N of N. */
export interface CiWorkflowSuiteJobPolicy {
  readonly nodeVersions: readonly number[];
  readonly shards: readonly number[];
  readonly shardCount: number;
}


/** Every shard from 1 to N must run, and the command must name the same N: a missing shard is a missing part of the suite. */
export function suitePolicy(suiteJob: Record<string, unknown>, command: string): CiWorkflowSuiteJobPolicy {
  const matrix = asRecord(asRecord(suiteJob['strategy'], 'suite.strategy')['matrix'], 'suite.matrix');
  const shards = asArray(matrix['shard'], 'suite.shard').map(Number);
  const named = /BIJOU_VITEST_SHARD=\$\{\{ matrix\.shard \}\}\/(\d+) npm run test:run/u.exec(command);
  const shardCount = named ? Number(named[1]) : Number.NaN;
  const complete = shards.length === shardCount && shards.every((shard, index) => shard === index + 1);
  if (!complete) {
    throw new Error(`Full test suite shards must be 1 to ${String(shardCount)}, each once, got [${shards.join(', ')}]`);
  }
  return {
    nodeVersions: asArray(matrix['node-version'], 'suite.node-version').map(Number),
    shards,
    shardCount,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be a mapping`);
  return value;
}

function asArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be a sequence`);
  return value;
}
