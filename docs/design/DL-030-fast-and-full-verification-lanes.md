---
title: DL-030 Fast And Full Verification Lanes
lane: bad-code
priority: medium
github_issue: 608
status: decided
keywords:
  - ci
  - verification
  - pre-push
  - code-dojo
  - dogfood
  - v8.2.0
---

# Fast And Full Verification Lanes

## Linked Work

- Decision card: [#608](https://github.com/flyingrobots/bijou/issues/608)
- Parent container: [#376](https://github.com/flyingrobots/bijou/issues/376)
- Dependents: path classifier [#610](https://github.com/flyingrobots/bijou/issues/610),
  pre-push fast lane [#611](https://github.com/flyingrobots/bijou/issues/611),
  DOGFOOD localization check [#613](https://github.com/flyingrobots/bijou/issues/613),
  required full lane [#614](https://github.com/flyingrobots/bijou/issues/614)
- Sibling: CI wall-time summary [#609](https://github.com/flyingrobots/bijou/issues/609)
- Related: strict standards type check [#583](https://github.com/flyingrobots/bijou/issues/583),
  pre-push transport receipt [#479](https://github.com/flyingrobots/bijou/issues/479)

## Decision Summary

Bijou has two verification lanes. Every path in a diff is classified by one
rule table, and the diff takes the heaviest lane of any path it touches.
Unknown paths are classified **full**.

- The **fast lane** runs on every `git push` and on every push to a draft pull
  request. It runs every Code Dojo ratchet, the code-size gate, a built
  workspace lint and ESLint, the test type check, the DOGFOOD localization
  gates when DOGFOOD-relevant paths move, and only the Vitest files related to
  the change.
- The **full lane** is the current release-grade lane, unchanged in content. It
  runs on every pull request that is not a draft, on every push to a draft pull
  request whose diff classifies full, on every push to `main`, and on release
  tags. Merge requires a green full lane for the merged head.
- One always-reporting job, `Verification gate`, becomes the single required
  status check on `main`. It fails when the lane that the event requires did
  not pass, so a skipped job can never produce a green merge.

No release gate is removed or weakened. The change is *when* the full lane
runs, not *what* it proves.

## Measured Baseline

Numbers come from the ten latest completed `ci.yml` pull-request runs
(runs `43774770546` to `43781889554` on `feat/hero-demo-gif`, plus
`43586054187` on `feat/declarative-braille-plot`, 2026-11-15) and the ten
latest `code-dojo.yml` runs. All values are job wall time in seconds.

| Job | min | median | max |
| --- | ---: | ---: | ---: |
| `test (22)` | 386 | 440 | 539 |
| `test (20)` | 333 | 388 | 548 |
| `Focused Unit Tests (windows, Node 22)` | 114 | 164 | 191 |
| `Bench Gradient` | 86 | 100 | 125 |
| `Focused Unit Tests (ubuntu, Node 22)` | 75 | 96 | 127 |
| `Verify TypeScript doctrine` (Code Dojo) | 78 | 88 | 99 |
| `Smoke DOGFOOD (docs)` | 63 | 69 | 85 |
| `Smoke DOGFOOD (landing)` | 53 | 67 | 70 |
| `Classify changed paths` | 7 | 10 | 14 |
| **`ci.yml` run wall time** | **397** | **516** | **565** |

Inside `test (22)`, the steps are dominated by one command:

| Step | median |
| --- | ---: |
| `npm run test:run` (full chunked Vitest) | 331 |
| `npm ci --engine-strict` | 33 |
| `Smoke canary apps` | 23 |
| `npm run lint` | 11 |
| `Typecheck tests` | 11 |
| `npm run build` | 9 |
| DOGFOOD i18n policy gate | 3 |
| `Smoke interactive examples` | 1 |
| `npm run code:size` | 1 |

The full Vitest run is about 75% of the critical path. The full suite is
879 files and 3,977 tests (evidence recorded on #479). The local
`scripts/hooks/pre-push` runs that same suite, plus the test type check and the
scripted interactive smoke, on every push. PR #478 lost its SSH connection
twice while that suite ran inside the hook.

Three defects in the current gates are fixed by this decision:

1. **Lint without a build.** `.githooks/pre-push` runs `code-dojo:prepush`,
   which runs `npm run lint` (per-workspace `tsc --noEmit`) and
   `lint:eslint` before anything is built. `code-dojo.yml` runs
   `code-dojo:verify` with no build step. Both can fail or pass on stale
   or missing declaration output, so their result depends on the checkout.
2. **Strict standards config is not gated.** No script or workflow runs
   `tsc --noEmit -p tsconfig.code-standards.json` (#583).
3. **Duplicated classifier.** `is_dogfood_relevant` exists twice, in
   `ci.yml` and in `scripts/hooks/pre-push`, with no tests. The two copies
   can drift.

The `main` ruleset (`13197689`) has no required status checks today. A merge
is currently blocked by convention, not by GitHub.

## Directions Considered

| Direction | Strength | Rejected cost |
| --- | --- | --- |
| **Path-classified fast lane, full lane required at merge** | Draft iteration and every local push skip the 331 s suite; release proof unchanged | selected |
| Keep the single heavy lane | Simplest; nothing to classify | Every push pays about 8.6 min remote (median run) plus the full local suite; #375 and #478 evidence |
| Fast lane only for fast-classified PRs, no full lane at merge | Fastest docs and test PRs | A green merge would no longer imply the release-grade proof; docs paths feed DOGFOOD (`docs/*` is DOGFOOD-relevant today), so a "docs-only" merge can break DOGFOOD smokes on `main` |
| Merge queue (`merge_group`) runs the full lane | Full lane runs exactly once per merge | Needs a queue on a single-maintainer repo; review happens before the queue, so the reviewer sees no full proof; can be added later without changing this contract |
| Weaken or remove release gates | Fast | Rejected by #376: "This is not a request to weaken release quality." |

The status quo lost on measurement: the full Vitest run alone costs a median
331 s per remote job and runs twice (Node 20 and 22) on every push, and the
same suite runs again locally before each push.

Dropping the full lane at merge lost because the risk is not where the path
says it is. Design records, the source corpus and the DOGFOOD docs are all
under `docs/`, and DOGFOOD renders them. A rule that let `docs/**` merge on the
fast lane would have to be exactly right about which files DOGFOOD reads. The
selected design does not need that precision, because the full lane still runs
once before merge.

The merge queue is not rejected on merit; it is deferred. `Verification gate`
accepts a `merge_group` event in the same way as a non-draft pull request, so a
queue can be enabled later without a new decision.

## Lane Contents

### Fast lane

| Gate | Command | Local pre-push | CI fast job |
| --- | --- | --- | --- |
| Lane classification | `npm run verify:lane` | yes | yes |
| Code Dojo debt ratchet | `npm run code-dojo:debt` | yes | yes |
| Code Dojo strict file checks | `npm run code-dojo:strict` | yes | yes |
| Code size ratchet | `npm run code:size` | yes | yes |
| Build | `npm run build` | yes | yes |
| Workspace lint (after build) | `npm run lint` | yes | yes |
| ESLint offenders ratchet | `npm run lint:eslint` | yes | yes |
| Test type check | `npm run typecheck:test` | yes | yes |
| DOGFOOD i18n completeness, catalog check, debt | `dogfood:i18n:complete`, `dogfood:i18n:check`, `dogfood:i18n:debt -- --base <base>` | when `dogfood` is true | when `dogfood` is true |
| Related tests | `npm run test:related -- --base <base>` | yes | yes |

`test:related` runs `vitest related` on the changed source and test files. For
a diff with no TypeScript paths it runs nothing and prints
`fast lane: no related tests for this diff`.

The build is incremental (`tsc -b`, 9 s median in CI). It is in the fast lane
so lint and ESLint always see built declarations. This fixes defect 1.

### Full lane

The full lane is the fast lane plus every existing release-grade gate:

- `test (20)` and `test (22)`: build, lint, code size, `npm run test:run`;
  on Node 22 also the design-system docs preflight, DOGFOOD coverage gate,
  DOGFOOD i18n policy gate, interactive example smoke, test type check, and
  canary smoke. Content stays as it is in `ci.yml` today.
- `Focused Unit Tests (ubuntu, Node 22)` and `(windows, Node 22)`.
- `Smoke DOGFOOD (landing)` and `Smoke DOGFOOD (docs)`. In the full lane
  they always run; the DOGFOOD path skip is removed.
- `Code Dojo` (`npm run code-dojo:verify`, after a build).
- `Strict standards types` (`npm run typecheck:standards`). It reports only
  until #583 reaches zero errors; #583 makes it blocking. This is additive:
  the check is not run anywhere today.
- `Bench Gradient` stays informational and is not an input to
  `Verification gate`.

Locally, `BIJOU_FULL_PUSH=1 git push` runs the full local lane: the fast lane
with `npm run test:run` instead of `test:related`, plus
`npm run verify:interactive-examples`. This is the existing variable, with its
meaning extended from "force DOGFOOD gates" to "force the full local lane".

## Path Classification

The classifier reads changed paths and applies the first matching rule to each
path. The diff lane is `full` if any path is `full`. The `dogfood` flag is true
if any path matches a DOGFOOD-relevant pattern. Globs use `picomatch` semantics.

### Full (escalation rules)

| Reason id | Patterns |
| --- | --- |
| `core-runtime` | `packages/*/src/**` except test files, `packages/*/package.json`, `packages/*/bin/**` |
| `generated-asset` | `examples/docs/i18n/catalogs/**`, `docs/book/source-corpus.json`, `docs/book/source-manifest.json`, `docs/book/*.pdf`, `docs/book/*.tex`, `bench/baselines/**` |
| `dogfood-source` | `examples/**`, `scripts/dogfood-*`, `scripts/smoke-*`, `tests/cycles/DF-*/**`, `tests/cycles/*dogfood*/**` |
| `release-doc` | `docs/releases/**`, `README.md`, `packages/*/README.md`, `scripts/release-*` |
| `ratchet-baseline` | `scripts/code-dojo/baselines/**`, `scripts/code-size-gate-baseline.ts`, `examples/docs/i18n-debt-baseline*.ts`, `docs/code-dojo-exceptions.md` |
| `gate-definition` | `.github/**`, `.githooks/**`, `scripts/hooks/**`, `scripts/code-dojo/**`, `scripts/verification-lane*`, `scripts/run-vitest.mjs` |
| `toolchain` | `package.json`, `package-lock.json`, `tsconfig*.json`, `vitest.config.*`, `eslint.config.*`, `.nvmrc`, `.npmrc` |
| `unknown` | any path that matches no rule |

### Fast

| Reason id | Patterns |
| --- | --- |
| `test-only` | `**/*.test.ts`, `**/*.test.mjs`, `tests/**` (after the DOGFOOD test rule above) |
| `docs-only` | `docs/**` not matched above, `*.md` at the repository root other than `README.md` |
| `script-tooling` | other `scripts/**/*.ts` and `scripts/**/*.mjs` |

`docs/CHANGELOG.md` is `docs-only`. Nearly every pull request edits it, so
treating it as a release doc would make every diff full. Release notes live
under `docs/releases/`, which is full.

### DOGFOOD-relevant (sets `dogfood`)

The existing patterns, moved into the classifier unchanged:
`.github/workflows/*`, `package.json`, `package-lock.json`, `packages/*`,
`examples/docs/*`, `scripts/dogfood-*`, `scripts/smoke-dogfood*`,
`tests/cycles/DF-*`, `tests/cycles/*dogfood*`, `docs/*`. Here `*` matches
across `/`, as in the current shell `case` patterns.

## Event Matrix

| Event | Classified fast | Classified full |
| --- | --- | --- |
| Local `git push` | fast lane | full local lane |
| Local `BIJOU_FULL_PUSH=1 git push` | full local lane | full local lane |
| `pull_request` on a draft | fast lane | full lane |
| `pull_request` not a draft, including `ready_for_review` | full lane | full lane |
| `merge_group` (if enabled later) | full lane | full lane |
| `push` to `main`, release tag | full lane | full lane |

`Verification gate` passes when every job of the required lane succeeded. It
fails when a required job failed, was cancelled, or was skipped.

## Consequences

- Draft iteration on a docs or test diff skips both full Vitest runs. With the
  median numbers above, the remote critical path falls from about 516 s to the
  fast job (estimated under 150 s: install 33, build 9, lint 11, typecheck 11,
  Code Dojo about 55 without its install, related tests). #611 and #614 record
  the measured result.
- A local push no longer holds the remote connection around the 879-file
  suite unless the diff is full or `BIJOU_FULL_PUSH=1` is set. #479 still
  owns the transport problem for full pushes.
- Marking a pull request ready for review costs one full lane run. Review starts
  with the full proof already visible.
- A diff that changes classification during review (for example, a later
  commit touches `packages/bijou/src/`) escalates on that push. Classification
  is always computed against the merge base, never against the previous push.
- The `main` ruleset gains one required check, `Verification gate`. Job
  names inside the lanes can change without editing the ruleset.
- The classifier is now gate definition: editing it classifies full.
- The ratchets stay enforceable: `code-dojo:debt`, `code-dojo:strict`,
  `code:size`, `lint:eslint` and the DOGFOOD debt ratchet run in both lanes.
  No baseline file changes.
- A green fast lane does not imply any release-grade gate ran. Every fast-lane
  summary lists the gates it did not run.

Reversal is a later decision record. The rule table and the event matrix are
the only policy; changing either needs a design note.

## Contracts For Dependent Work

### #610 Classify changed paths

- Module: `scripts/verification-lane.ts`, with tests in
  `scripts/verification-lane.test.ts`.
- Export: `classifyVerificationLane(paths: readonly string[]): LaneDecision`,
  where `LaneDecision` is
  `{ lane: 'fast' | 'full'; dogfood: boolean; reasons: readonly { path: string; lane: 'fast' | 'full'; reason: ReasonId }[] }`
  and `ReasonId` is exactly the reason ids in the two rule tables above.
- CLI: `npm run verify:lane -- [--base <ref>] [--paths-from <file|->] [--json]`.
  The default base is the merge base with `origin/main`. Text output ends with
  `lane=<fast|full> dogfood=<true|false>`; `--json` prints the `LaneDecision`.
  In GitHub Actions it also writes `lane` and `dogfood` to
  `$GITHUB_OUTPUT`.
- An empty path list classifies `full` with reason `unknown`. A diff that
  cannot be computed exits non-zero; it never defaults to fast.
- The golden test is a table of diffs and expected lanes. It covers each reason
  id, mixed diffs that escalate, `docs/CHANGELOG.md`, and an unknown path.
  A parity test proves the DOGFOOD patterns match the current shell
  `case` behaviour for every path in `git ls-files`.
- Out of scope: hooks and workflows.

### #611 Pre-push fast lane

- `scripts/hooks/pre-push` keeps its stdin ref parsing and pipes the pushed
  paths to `npm run -s verify:lane -- --paths-from - --json`. Its local
  `is_dogfood_relevant_path` copy is deleted.
- `.githooks/pre-push` runs one entry point, `scripts/hooks/pre-push`. The
  hook runs the fast lane gates in the order of the fast-lane table:
  build first, then lint.
- `code-dojo:prepush` becomes
  `npm run code-dojo:debt && npm run code-dojo:strict && npm run build && npm run lint && npm run lint:eslint`.
- Add `test:related` to `package.json`. It is the related-tests command of
  the fast lane.
- `lane=full` or `BIJOU_FULL_PUSH=1` runs the full local lane.
- The hook prints `pre-push: lane=<lane> (<reason ids>)` first and a
  not-run list last.
- Acceptance evidence: before and after timings for one docs-only push and one
  full push, recorded on the PR.

### #613 DOGFOOD localization check

- Trigger: `dogfood` is true in the `LaneDecision`, never a second path list.
- Commands: `npm run dogfood:i18n:complete -- --base <base>`,
  `npm run dogfood:i18n:check`, `npm run dogfood:i18n:debt -- --base <base>`,
  with the same base that the classifier used.
- When `dogfood` is false, the fast lane prints exactly
  `DOGFOOD localization: not evaluated (no DOGFOOD-relevant paths)` in the hook
  output and in `$GITHUB_STEP_SUMMARY`.
- Golden: the PR #470 case (14 new raw strings in a moved DOGFOOD file) fails
  the fast lane.

### #614 Required full lane in CI

- `ci.yml` gains a `lane` job, which replaces `changes` and runs
  `npm run verify:lane`. It outputs `lane`, `dogfood` and
  `required` (`fast` or `full`, from the event matrix).
- A `fast` job runs the fast-lane table. It runs for every pull request
  event.
- The full-lane jobs (`test (20)`, `test (22)`, both focused unit jobs, both
  DOGFOOD smokes, `Code Dojo`, `Strict standards types`, `Bench Gradient`)
  run when `required == 'full'`.
- `code-dojo.yml` folds into `ci.yml` as the `Code Dojo` job, with
  `npm run build` before `npm run code-dojo:verify`.
- Add the script `typecheck:standards` =
  `tsc --noEmit -p tsconfig.code-standards.json`. The job has
  `continue-on-error: true` until #583 closes.
- `pull_request` triggers include `ready_for_review`.
- `Verification gate` runs with `if: always()`, needs every lane job, and
  fails on any `failure`, `cancelled`, or (for a required job) `skipped`
  result. `Bench Gradient` and `Strict standards types` are not inputs while
  they are informational.
- The `main` ruleset adds `Verification gate` as its only required status
  check after the new workflow has reported green on one pull request.
- Acceptance evidence: one draft docs-only run, one ready run of the same pull
  request, and one draft run with a full-classified diff.

## Non-Goals

- Removing, splitting or speeding up any individual gate. #298 and #299 own
  the DOGFOOD render and PTY costs.
- The CI wall-time summary (#609).
- The pre-push receipt and transport boundary (#479).
- Fixing the strict-config errors (#583).
