import { describe, expect, it } from 'vitest';
import { classifyVerificationLane, requiredPolicy, type ReasonId } from './verification-lane.js';

type Row = readonly [path: string, lane: 'fast' | 'full', reason: ReasonId, pattern: string];

// Golden table (DL-030 "Contracts For Dependent Work", #610): one diff of one path per row.
const GOLDEN: readonly Row[] = [
  ['docs/CHANGELOG.md', 'fast', 'docs-only', 'docs/**'],
  ['docs/guides/sealed-tests.md', 'fast', 'docs-only', 'docs/**'],
  ['CONTRIBUTING.md', 'fast', 'docs-only', '*.md'],
  ['README.fr.md', 'fast', 'docs-only', '*.md'],
  ['tests/cycles/WF-129/path-gate-dogfood-ci.test.ts', 'fast', 'test-only', '**/*.test.ts'],
  ['tests/repo.ts', 'fast', 'test-only', 'tests/**'],
  ['tests/cycles/LX-011/dogfood-locale-ratchet.part03.test.ts', 'fast', 'test-only', '**/*.test.ts'],
  ['packages/bijou/src/core/render/packed-cell.test.ts', 'fast', 'test-only', '**/*.test.ts'],
  ['bench/src/gradient.test.ts', 'fast', 'test-only', '**/*.test.ts'],
  ['scripts/frame-assertions.test.ts', 'fast', 'test-only', '**/*.test.ts'],
  ['scripts/frame-assertions.ts', 'fast', 'script-tooling', 'scripts/**/*.ts'],
  ['scripts/clean.mjs', 'fast', 'script-tooling', 'scripts/**/*.mjs'],
  ['packages/bijou/src/index.ts', 'full', 'core-runtime', 'packages/*/src/**'],
  ['packages/bijou/src/core/frame.test-support.ts', 'full', 'core-runtime', 'packages/*/src/**'],
  ['packages/bijou/src/__snapshots__/frame.test.ts.snap', 'full', 'core-runtime', 'packages/*/src/**'],
  ['packages/bijou/package.json', 'full', 'core-runtime', 'packages/*/package.json'],
  ['packages/create-bijou-tui-app/bin/create.js', 'full', 'core-runtime', 'packages/*/bin/**'],
  ['examples/docs/i18n/catalogs/fr.json', 'full', 'generated-asset', 'examples/docs/i18n/catalogs/**'],
  ['docs/book/source-corpus.json', 'full', 'generated-asset', 'docs/book/source-corpus.json'],
  ['docs/book/source-manifest.json', 'full', 'generated-asset', 'docs/book/source-manifest.json'],
  ['docs/book/bijou-archive.pdf', 'full', 'generated-asset', 'docs/book/*.pdf'],
  ['docs/book/bijou-designs.tex', 'full', 'generated-asset', 'docs/book/*.tex'],
  ['bench/baselines/gradient.json', 'full', 'generated-asset', 'bench/baselines/**'],
  ['examples/docs/app.ts', 'full', 'dogfood-source', 'examples/**'],
  ['examples/docs/app.test.ts', 'full', 'dogfood-source', 'examples/**'],
  ['examples/hero/package.json', 'full', 'dogfood-source', 'examples/**'],
  ['scripts/dogfood-coverage-gate.ts', 'full', 'dogfood-source', 'scripts/dogfood-*'],
  ['scripts/smoke-dogfood-failure.test.ts', 'full', 'dogfood-source', 'scripts/smoke-*'],
  ['tests/cycles/DF-031/drawer.test.ts', 'full', 'dogfood-source', 'tests/cycles/DF-*/**'],
  ['tests/cycles/WF-dogfood-smoke/run.test.ts', 'full', 'dogfood-source', 'tests/cycles/*dogfood*/**'],
  ['docs/releases/v8.2.0.md', 'full', 'release-doc', 'docs/releases/**'],
  ['README.md', 'full', 'release-doc', 'README.md'],
  ['packages/bijou/README.md', 'full', 'release-doc', 'packages/*/README.md'],
  ['scripts/release-notes.ts', 'full', 'release-doc', 'scripts/release-*'],
  ['scripts/code-dojo/baselines/eslint.json', 'full', 'ratchet-baseline', 'scripts/code-dojo/baselines/**'],
  ['scripts/code-size-gate-baseline.ts', 'full', 'ratchet-baseline', 'scripts/code-size-gate-baseline.ts'],
  ['examples/docs/i18n-debt-baseline.ts', 'full', 'ratchet-baseline', 'examples/docs/i18n-debt-baseline*.ts'],
  ['docs/code-dojo-exceptions.md', 'full', 'ratchet-baseline', 'docs/code-dojo-exceptions.md'],
  ['.github/workflows/ci.yml', 'full', 'gate-definition', '.github/**'],
  ['.githooks/pre-push', 'full', 'gate-definition', '.githooks/**'],
  ['scripts/hooks/pre-push', 'full', 'gate-definition', 'scripts/hooks/**'],
  ['scripts/code-dojo/check-eslint.mjs', 'full', 'gate-definition', 'scripts/code-dojo/**'],
  ['scripts/verification-lane.ts', 'full', 'gate-definition', 'scripts/verification-lane*'],
  ['scripts/verification-lane-rules.ts', 'full', 'gate-definition', 'scripts/verification-lane*'],
  ['scripts/verification-lane.test.ts', 'full', 'gate-definition', 'scripts/verification-lane*'],
  ['scripts/run-vitest.mjs', 'full', 'gate-definition', 'scripts/run-vitest.mjs'],
  ['scripts/docker-seal/run.mjs', 'full', 'gate-definition', 'scripts/docker-seal/**'],
  ['scripts/docker-seal/Dockerfile', 'full', 'gate-definition', 'scripts/docker-seal/**'],
  ['scripts/docker-seal/hook-changed-paths.test.ts', 'full', 'gate-definition', 'scripts/docker-seal/**'],
  ['scripts/code-dojo-debt.ts', 'full', 'gate-definition', 'scripts/code-dojo-*'],
  ['scripts/code-size-gate.ts', 'full', 'gate-definition', 'scripts/code-size-gate*'],
  ['schemas/code-dojo.debt-report.v1.schema.json', 'full', 'gate-definition', 'schemas/**'],
  ['package.json', 'full', 'toolchain', 'package.json'],
  ['package-lock.json', 'full', 'toolchain', 'package-lock.json'],
  ['tsconfig.json', 'full', 'toolchain', 'tsconfig*.json'],
  ['tsconfig.tests.json', 'full', 'toolchain', 'tsconfig*.json'],
  ['vitest.config.ts', 'full', 'toolchain', 'vitest.config.*'],
  ['eslint.config.mjs', 'full', 'toolchain', 'eslint.config.*'],
  ['.nvmrc', 'full', 'toolchain', '.nvmrc'],
  ['.npmrc', 'full', 'toolchain', '.npmrc'],
  ['packages/bijou/tsconfig.json', 'full', 'toolchain', '**/tsconfig*.json'],
  ['bench/tsconfig.json', 'full', 'toolchain', '**/tsconfig*.json'],
  ['docs/site/package.json', 'full', 'toolchain', '**/package.json'],
  ['docs/site/package-lock.json', 'full', 'toolchain', '**/package-lock.json'],
  ['scripts/canary-fixtures/core-static/tsconfig.json', 'full', 'toolchain', '**/tsconfig*.json'],
  ['LICENSE', 'full', 'unknown', '<no rule>'],
  ['.gitignore', 'full', 'unknown', '<no rule>'],
  ['assets/logo.png', 'full', 'unknown', '<no rule>'],
  ['bench/src/gradient.ts', 'full', 'unknown', '<no rule>'],
  ['scripts/hooks.sh', 'full', 'unknown', '<no rule>'],
  ['docs/.vitepress/config.ts', 'full', 'unknown', '<no rule>'],
  ['.graft/state.json', 'full', 'unknown', '<no rule>'],
];

describe('verification lane golden table', () => {
  it.each(GOLDEN)('%s -> %s (%s)', (path, lane, reason, pattern) => {
    const decision = classifyVerificationLane([path]);

    expect(decision.lane).toBe(lane);
    expect(decision.reasons).toEqual([{ path, status: null, lane, reason, pattern, escalation: null }]);
  });

  it('covers every reason id in the rule tables', () => {
    const covered = new Set(GOLDEN.map(([, , reason]) => reason));
    const all: readonly ReasonId[] = [
      'core-runtime', 'generated-asset', 'dogfood-source', 'release-doc', 'ratchet-baseline', 'gate-definition',
      'toolchain', 'unknown', 'test-only', 'docs-only', 'script-tooling',
    ];

    expect([...covered].sort()).toEqual([...all].sort());
  });

  it('escalates a mixed diff to full when any path is full', () => {
    expect(classifyVerificationLane(['docs/CHANGELOG.md', 'packages/bijou/src/index.ts']).lane).toBe('full');
    expect(classifyVerificationLane(['docs/CHANGELOG.md', 'tests/repo.ts', 'LICENSE']).lane).toBe('full');
    expect(classifyVerificationLane(['scripts/clean.mjs', 'docs/releases/v8.2.0.md']).lane).toBe('full');
  });

  it('keeps a docs and test only diff fast', () => {
    const decision = classifyVerificationLane(['docs/CHANGELOG.md', 'tests/repo.ts', 'scripts/frame-assertions.test.ts']);

    expect(decision.lane).toBe('fast');
    expect(decision.reasons.map((entry) => entry.reason)).toEqual(['docs-only', 'test-only', 'test-only']);
  });

  it('sets the dogfood flag from the shell DOGFOOD patterns, not from the lane', () => {
    expect(classifyVerificationLane(['docs/CHANGELOG.md']).dogfood).toBe(true);
    expect(classifyVerificationLane(['tests/cycles/LX-011/dogfood-locale-ratchet.part03.test.ts']).dogfood).toBe(true);
    expect(classifyVerificationLane(['scripts/clean.mjs', 'CONTRIBUTING.md']).dogfood).toBe(false);
  });

  it('maps each lane to its versioned policy identity', () => {
    expect(requiredPolicy('fast')).toBe('bijou.verify.fast.v1');
    expect(requiredPolicy('full')).toBe('bijou.verify.full.v1');
  });
});
