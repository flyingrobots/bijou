/**
 * The DL-030 path rule table (docs/design/DL-030-fast-and-full-verification-lanes.md).
 *
 * Rules are tried in order and the first match decides a path. Every full rule
 * comes before every fast rule, so a path that matches both is full. The fast
 * rules are an allow-list: a path that matches no rule is `unknown` and full.
 * Editing this file classifies full (`scripts/verification-lane*`).
 */

export type Lane = 'fast' | 'full';
export type FullReasonId =
  | 'core-runtime'
  | 'generated-asset'
  | 'dogfood-source'
  | 'release-doc'
  | 'ratchet-baseline'
  | 'gate-definition'
  | 'toolchain'
  | 'unknown';
export type FastReasonId = 'test-only' | 'docs-only' | 'script-tooling';
export type ReasonId = FullReasonId | FastReasonId;

export interface LaneRule {
  readonly lane: Lane;
  readonly reason: ReasonId;
  /** picomatch-style glob: `*` stays inside one segment, `**` spans segments, dot segments never match a wildcard. */
  readonly pattern: string;
  /** A path that also matches this glob skips the rule. */
  readonly except?: string;
}

const full = (reason: FullReasonId, patterns: readonly string[], except?: string): LaneRule[] =>
  patterns.map((pattern) => (except == null ? { lane: 'full', reason, pattern } : { lane: 'full', reason, pattern, except }));
const fast = (reason: FastReasonId, patterns: readonly string[]): LaneRule[] =>
  patterns.map((pattern) => ({ lane: 'fast', reason, pattern }));

/**
 * Order matters only for which reason a full path reports: specific reasons
 * (baseline, gate, toolchain, generated asset) come before the broad
 * `examples/**` and `packages/*` rules, so a ratchet baseline under
 * `examples/docs` reports `ratchet-baseline`, not `dogfood-source`.
 */
export const LANE_RULES: readonly LaneRule[] = [
  ...full('ratchet-baseline', [
    'scripts/code-dojo/baselines/**',
    'scripts/code-size-gate-baseline.ts',
    'examples/docs/i18n-debt-baseline*.ts',
    'docs/code-dojo-exceptions.md',
  ]),
  ...full('gate-definition', [
    '.github/**',
    '.githooks/**',
    'scripts/hooks/**',
    'scripts/code-dojo/**',
    'scripts/verification-lane*',
    'scripts/run-vitest.mjs',
    // Beyond the DL-030 table, fail closed: the sealed runner and the gate implementations.
    'scripts/docker-seal/**',
    'scripts/code-dojo-*',
    'scripts/code-size-gate*',
    'schemas/**',
  ]),
  ...full('toolchain', [
    'package.json',
    'package-lock.json',
    'tsconfig*.json',
    'vitest.config.*',
    'eslint.config.*',
    '.nvmrc',
    '.npmrc',
  ]),
  ...full('generated-asset', [
    'examples/docs/i18n/catalogs/**',
    'docs/book/source-corpus.json',
    'docs/book/source-manifest.json',
    'docs/book/*.pdf',
    'docs/book/*.tex',
    'bench/baselines/**',
  ]),
  ...full('release-doc', ['docs/releases/**', 'README.md', 'packages/*/README.md', 'scripts/release-*']),
  ...full('core-runtime', ['packages/*/src/**'], '**/*.test.{ts,mjs}'),
  ...full('core-runtime', ['packages/*/package.json', 'packages/*/bin/**']),
  ...full('dogfood-source', [
    'examples/**',
    'scripts/dogfood-*',
    'scripts/smoke-*',
    'tests/cycles/DF-*/**',
    'tests/cycles/*dogfood*/**',
  ]),
  // Beyond the DL-030 table, fail closed: nested manifests, lockfiles and compiler configs.
  ...full('toolchain', ['**/package.json', '**/package-lock.json', '**/tsconfig*.json']),
  ...fast('test-only', ['**/*.test.ts', '**/*.test.mjs', 'tests/**']),
  ...fast('docs-only', ['docs/**', '*.md']),
  ...fast('script-tooling', ['scripts/**/*.ts', 'scripts/**/*.mjs']),
];

/**
 * Why each fast pattern may skip the full Vitest suite while a pull request is
 * a draft. None of them claims that a change cannot affect any outcome; each
 * names what still verifies it. Per DL-030 the fast lane runs build, every
 * Code Dojo ratchet, code size, lint, ESLint, `typecheck:test`, the DOGFOOD
 * localization gates and related tests, and the full lane runs once more
 * before merge whatever the classification.
 */
export const FAST_JUSTIFICATIONS: Readonly<Record<string, string>> = {
  '**/*.test.ts':
    'A test file that no full rule took (examples, gates, the sealed runner and DOGFOOD cycles are full) changes only what is asserted, never what ships. The fast lane type-checks it and runs it as a related test; the full suite runs before merge.',
  '**/*.test.mjs':
    'The same as **/*.test.ts for ESM test files: run as a related test in the fast lane, and in the full suite before merge.',
  'tests/**':
    'Cross-package tests and their helpers, after the DOGFOOD cycle rules took tests/cycles/DF-* and *dogfood*. Related tests and typecheck:test run them in the fast lane; nothing ships from tests/.',
  'docs/**':
    'Documentation after the generated book assets, release notes and the Code Dojo exception ledger were taken as full. DOGFOOD reads docs/, so the dogfood flag stays true and the DOGFOOD localization gates always run; the full lane renders DOGFOOD before merge.',
  '*.md':
    'Root Markdown other than README.md (the npm front page, taken as release-doc). No build or test imports these files.',
  'scripts/**/*.ts':
    'Repository tooling after hooks, Code Dojo, the sealed runner, the code-size gate, DOGFOOD, smoke and release scripts were taken as full. Nothing under scripts/ is published; the fast lane builds, lints and type-checks it and runs its related tests.',
  'scripts/**/*.mjs':
    'The same as scripts/**/*.ts for plain ESM tooling scripts.',
};
