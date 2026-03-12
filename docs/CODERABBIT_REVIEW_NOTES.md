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

## Backlog Candidates
- Build `scripts/pr-review-status.sh` to print: PR number, unresolved thread count, open high-severity findings, check status, and CodeRabbit cooldown (if any).
- Build `scripts/pr-review-threads.ts` to export unresolved threads as JSON/Markdown with severity bucketing and dedupe.
- Build `scripts/pr-review-resolve.ts` to resolve confirmed-addressed thread IDs in bulk.
- Build `scripts/pr-review-reply.ts` to apply structured reply templates and resolve addressed threads in one pass.
- Suppress or ignore generated Python bytecode artifacts for `scripts/pty-driver.py` so PTY test runs do not dirty the worktree with `scripts/__pycache__/`.
- Add unit coverage for `scripts/smoke-all-examples.ts` path/root resolution and launcher selection so portability fixes are locked in before full smoke runs.
- Add one more PTY lifecycle regression focused on resize/exit ordering and other late-step shutdown races.
- Add a scaffold canary CI script that generates a fresh `create-bijou-tui-app` project, installs deps, builds it, and smoke-runs it once.
- Add a release dry-run workflow or helper script that exercises the publish matrix and release-note generation without publishing to registries.
- Add a small benchmark harness for diff rendering, layout solves, recorder throughput, and worker round-trips so perf regressions have a repeatable signal.
