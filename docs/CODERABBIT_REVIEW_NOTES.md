# CodeRabbit Review Process Notes

## Purpose
Track recurring friction in the PR feedback loop and concrete fixes (scripts/process updates) to reduce review turnaround time.

## Active Notes

### 2026-03-05
- **Thread status visibility is fragmented**: `gh pr status` can show "changes requested" even when all checks are green; unresolved thread count must be queried separately via GraphQL.
  Proposed improvement: add a script that reports `checks + unresolved threads + latest CodeRabbit rate-limit status` in one command.
- **Comment-to-code mapping is noisy**: generated comments often include large suggestion blocks, making it slower to extract actionable deltas.
  Proposed improvement: parse comments into a compact local report (file, line, severity, one-line action).
- **Resolve workflow is manual**: after fixes, resolving many threads requires repetitive API calls.
  Proposed improvement: add a script that resolves threads by file/line after local verification.
- **Nits can hide real regressions**: trivial findings occasionally surface useful edge cases (e.g., split-pane multi-width divider).
  Proposed improvement: keep the policy of fixing all severities, but auto-group by subsystem to batch test runs efficiently.

### 2026-03-13
- **Historical bot chatter still competes with live bot state**: older CodeRabbit comments can remain prominent even when a newer check is green or a new review is actively in progress.
  Progress: `pr:review-status` already prefers live pending/pass CodeRabbit signals over older clean history and down-ranks stale historical `rate-limited` comments when a newer green signal exists.
  Remaining gap: make stale-history handling equally explicit for older clean/actionable bot chatter, so mixed historical comment streams need less human interpretation.

### 2026-03-15
- **Surface-first parity edges attract high-signal review feedback**: width normalization, title sizing, background metadata, and render-policy versus surface-model separation all surfaced as real issues during the `boxSurface()` / `alertSurface()` rollout.
  Progress: PR #45 shipped the core surface-first primitives and added targeted regressions for fixed-width clipping, title width, background preservation, and no-color model consistency.
  Remaining gap: codify a reusable parity-test pattern for paired string/surface APIs so future companion helpers inherit the same edge-case contract faster.
- **Worker proxy tests are still heavier than the rest of the suite**: the full pre-push run re-exposed timeout pressure in `packages/bijou-node/src/worker/worker.proxy.test.ts` even after the first local timeout bump.
  Progress: the file now uses an explicit `15_000ms` budget for the two async proxy-runtime tests, which stabilized the full-suite push.
  Remaining gap: reduce dynamic-import and mock overhead so those tests can move back toward the default timeout budget.

## Backlog Candidates
- Build `scripts/pr-review-threads.ts` to export unresolved threads as JSON/Markdown with severity bucketing and dedupe.
- Build `scripts/pr-review-resolve.ts` to resolve confirmed-addressed thread IDs in bulk.
- Build `scripts/pr-review-reply.ts` to apply structured reply templates and resolve addressed threads in one pass.
- Add unit coverage for `scripts/smoke-all-examples.ts` path/root resolution and launcher selection so portability fixes are locked in before full smoke runs.
- Add one more PTY lifecycle regression focused on resize/exit ordering and other late-step shutdown races.
- Add a small benchmark harness for diff rendering, layout solves, recorder throughput, and worker round-trips so perf regressions have a repeatable signal.
- Add a local preflight command for workflow shell blocks so release-policy bash logic can be validated without waiting on GitHub Actions.
- Keep optimizing the packed `create-bijou-tui-app` bin-shim integration test so published-artifact coverage stays fast enough for the full suite.
- Consider extracting a small shared GitHub API adapter/helper layer so repo tooling scripts stop duplicating GraphQL/REST shapes and nullability handling.
- Generalize stale CodeRabbit history handling beyond `rate-limited` comments so older clean/actionable bot chatter is down-ranked as explicitly as rate-limit noise.
- Add a reusable parity-test helper or pattern for paired string/surface primitives so option-contract regressions are easier to lock down.
- Reduce the runtime cost of `packages/bijou-node/src/worker/worker.proxy.test.ts` so explicit elevated timeout budgets are no longer needed.
