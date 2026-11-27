// The focused tests the Windows CI job runs outside the seal. They are the
// Linux focused lane's list (job unit_cross_platform in .github/workflows/ci.yml)
// without SEAL_ONLY_TESTS; tests/ci-windows-job.test.ts holds the two together.

/** Tests that need the sealed runner itself, so they cannot run outside it. */
export const SEAL_ONLY_TESTS: readonly string[] = [
  // Checks the guard that admits tests into the seal, from inside the seal.
  'scripts/docker-seal/require-docker.test.ts',
  // Runs scripts/release-product-witnesses.ts, which loads that guard.
  'scripts/release-product-witnesses.test.ts',
];

export const WINDOWS_TESTS: readonly string[] = [
  'packages/bijou-tui/src/eventbus.part01.test.ts',
  'packages/bijou-tui/src/eventbus.part02.test.ts',
  'packages/bijou-tui/src/eventbus.part03.test.ts',
  'packages/bijou-tui/src/eventbus.part04.test.ts',
  'packages/bijou-tui/src/eventbus.part05.test.ts',
  'packages/bijou-tui/src/eventbus.part06.test.ts',
  'packages/bijou-tui/src/eventbus.part07.test.ts',
  'packages/bijou-tui/src/eventbus.part08.test.ts',
  'packages/bijou-tui/src/eventbus.part09.test.ts',
  'packages/bijou-tui/src/pipeline/pipeline.part01.test.ts',
  'packages/bijou-tui/src/pipeline/pipeline.part02.test.ts',
  'packages/bijou-node/src/index.part01.test.ts',
  'packages/bijou-node/src/index.part02.test.ts',
  'packages/bijou-node/src/index.part03.test.ts',
  'packages/bijou-node/src/index.part04.test.ts',
  'packages/bijou-mcp/src/stdio.test.ts',
  'packages/bijou-mcp/src/tools/hyperlink.test.ts',
  'packages/bijou-mcp/src/hyperlink-stdio.test.ts',
  'tests/cycles/WF-166/dependency-security-closeout.test.ts',
  'scripts/check-node-version.test.ts',
  'scripts/release-product-witness-files.test.ts',
  'scripts/docs-preview-components.part01.test.ts',
  'scripts/docs-preview-components.part02.test.ts',
  'scripts/docs-preview-components.part03.test.ts',
  'scripts/docs-preview-components.part04.test.ts',
  'scripts/docs-preview-entry.part01.test.ts',
  'scripts/docs-preview-entry.part02.test.ts',
  'scripts/docs-preview-entry.part03.test.ts',
  'scripts/docs-preview-entry.part04.test.ts',
  'scripts/docs-preview-entry.part05.test.ts',
  'scripts/docs-preview-landing.part01.test.ts',
  'scripts/docs-preview-landing.part02.test.ts',
  'scripts/docs-preview-landing.part03.test.ts',
  'scripts/docs-preview-landing.part04.test.ts',
  'scripts/docs-preview-landing.part05.test.ts',
  'scripts/docs-preview-search.part01.test.ts',
  'scripts/docs-preview-search.part02.test.ts',
  'scripts/docs-preview-search.part03.test.ts',
  'scripts/docs-preview-theme.part01.test.ts',
  'scripts/workspace-lock.test.ts',
  'scripts/staged-workspace.test.ts',
  'scripts/workspace-version-cli.test.ts',
  'scripts/docs-preview-theme.part02.test.ts',
  'scripts/docs-preview-theme.part03.test.ts',
  'scripts/docs-preview-theme.part04.test.ts',
  'scripts/ci-workflow-policy.test.ts',
  'scripts/docker-seal/windows-policy.test.ts',
  'scripts/docker-seal/windows-usage.test.ts',
  'scripts/docker-seal/windows-quarantine.test.ts',
  'scripts/docker-seal/windows-extraction.test.ts',
];
