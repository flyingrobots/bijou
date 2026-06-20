# WF-160 Respecting the Dojo Ratchet To 364

## Status

Implemented.

## Tracker

- GitHub Issue: [#433](https://github.com/flyingrobots/bijou/issues/433)
- Pull Request: [#434](https://github.com/flyingrobots/bijou/pull/434)

## Legend

- Linked legend: WF, Workflow and Delivery
- Sponsor human: James Ross
- Sponsor agent: Codex

## Hill

Bijou earns the next Code Dojo checkpoint by removing at least 50 counted
standards violations from the landed `main` ceiling without weakening the
Respectful Repo: Enter the Code Dojo direction.

## Current Truth

Live counts on `main` at `976bd1b7`:

- aggregate Code Dojo debt: `414`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- ESLint baseline: `6`
- next aggregate target: `364` or lower

The remaining ESLint bucket is too small to carry a 50-count slice by itself.
This cycle must therefore remove a blended set of final ESLint findings,
mock-ban violations, and file/context or code-size baseline entries.

Current ESLint offenders:

- `scripts/pr-review-status.ts`: `4`
- `examples/docs/coverage.ts`: `1`
- `packages/bijou/src/core/schema-block.test.ts`: `1`

Current mock-ban offender buckets:

- `packages/bijou-node/src/index.test.ts`: `11`
- `packages/bijou-node/src/io.test.ts`: `6`
- `packages/create-bijou-tui-app/src/cli.test.ts`: `4`
- `packages/bijou-tui/src/pipeline/pipeline.test.ts`: `1`

Near-threshold file/context candidates include files from `152` to `170` lines,
where small focused splits can remove baseline entries without creating new
large-file debt. Candidate clusters include core component helpers, TUI layout
tests, small examples, MCP docs tests, and cycle proof tests.

## Scope

- Remove the final live ESLint findings where the fixes are mechanically
  defensible.
- Replace existing test mocks and spies with observable fake adapters,
  environment restore helpers, or behavior assertions.
- Remove enough file/context or code-size baseline entries to reach `364` or
  lower.
- Prefer splitting cohesive helper/test fixtures into sub-150-line modules over
  compressing code to game line counts.
- Update `scripts/code-dojo/baselines/eslint.json`,
  `scripts/code-dojo/baselines/mock-ban.json`,
  `scripts/code-dojo/baselines/file-context.json`, `scripts/code-size-gate.ts`,
  `package.json`, `docs/code-dojo-exceptions.md`, and `docs/CHANGELOG.md` after
  the live count is proven lower.

## Non-Goals

- No new file/context, mock-ban, or code-size baseline entries.
- No release-version scope.
- No broad feature work.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Is aggregate Code Dojo debt at `364` or lower?
2. Did the implementation remove at least `50` real counted violations?
3. Did the final ESLint and mock-ban buckets shrink, ideally to zero?
4. Did file/context and code-size totals stay flat or lower with no new entries?
5. Did focused tests for touched behavior pass?
6. Did any file extraction preserve visible or API behavior?

## Accessibility And Assistive Posture

This is standards cleanup. Any touched rendered or terminal output must preserve
existing text, focus, lower-mode, and screen-reader semantics unless a test
explicitly proves an accessibility improvement.

## Localization And Directionality Posture

Avoid DOGFOOD copy edits unless the slice intentionally updates localization
catalogs. If DOGFOOD-facing strings are touched, run the DOGFOOD i18n gates and
hold the raw-string and missing-localization ratchets flat or lower.

## Agent Inspectability And Explainability Posture

The selected files, rule deltas, and validation commands must be captured in
this design doc or the PR summary so the next agent can audit what changed
without re-running broad discovery first.

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`

## Implementation Outline

1. Clear the final six ESLint findings with type-safe fixes and focused tests
   where runtime behavior is affected.
2. Remove mock-ban entries by replacing spies with deterministic fake writers,
   explicit process-environment restore helpers, or observable output.
3. Split or simplify enough near-threshold file/context entries to remove the
   remaining counted debt needed for the `364` target.
4. Recompute live counts, update baselines and docs, and lower the aggregate
   ceiling in `package.json`.
5. Run focused tests, `code-dojo:changed`, `code-dojo:verify`, docs inventory,
   workspace lint, and diff checks.

## Tests To Write First

- Add focused regressions for behavior-bearing lint or mock-ban cleanup.
- For pure test harness cleanup, prove equivalent behavior through the existing
  touched test file.
- For file splits, run the touched package or cycle test suite before updating
  baselines.

## Validation Plan

- `npm run code-dojo:eslint:offenders -- --limit 40`
- Focused raw ESLint on touched files when useful.
- Focused `npm run test:run -- <touched tests>`
- `npm run code-dojo:changed`
- `npm run code-dojo:debt`
- `npm run code-dojo:verify`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`

## Acceptance Criteria

- Aggregate Code Dojo debt is `364` or lower.
- At least `50` counted violations are removed from the WF-159 landed ceiling.
- The final counts and next target are recorded in the exception ledger.
- The package-script debt ceiling is lowered to the proven count.
- No Dojo bucket grows and no new baseline entry is added.

## Implementation Notes

WF-160 removes the final six ESLint findings, clears all `22` mock-ban
violations, and removes `22` file/context baseline entries. The resulting
aggregate debt is exactly `364`:

- file/context baseline: `309`
- mock-ban baseline: `0`
- code-size baseline: `55`, including `4` legacy hard-limit files
- ESLint baseline: `0`
- next aggregate target: `314` or lower

The mock-ban cleanup adds deterministic writer/platform seams for Node IO and
`create-bijou-tui-app`, plus an explicit plan-rebuild observer for the TUI
pipeline. The final ESLint cleanup removes unsafe or caller-chosen type
assertions from coverage parsing, schema-block tests, and PR review status
parsing. File/context cleanup is structural: oversized type clusters and test
fixtures are split into focused support modules while preserving behavior.

## Validation Evidence

- `npm run code-dojo:changed`
- `npm run code-dojo:debt -- --json`
- `npm run code-dojo:verify`
- `npm run dogfood:i18n:debt`
- `npm run docs:inventory`
- `npm run typecheck:test`
- `npm run lint`
- `git diff --check`
- focused Vitest suites for the touched Node IO, create-app CLI, pipeline,
  schema-block, PR review status, form, layout, TUI, MCP, theme, and cycle
  proof files
