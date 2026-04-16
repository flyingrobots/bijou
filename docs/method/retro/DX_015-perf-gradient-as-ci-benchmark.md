---
title: DX-015 — Perf Gradient as CI Benchmark
lane: retro
legend: DX
---

# DX-015 — Perf Gradient as CI Benchmark

## Disposition

Shipped a dedicated CI gradient benchmark lane using the existing wall-time harness. The repo now exposes npm run -s bench:ci:gradient for the fixed paint-gradient-rgb and diff-gradient scenario set, CI runs that lane on GitHub Actions, publishes the markdown summary to the step summary, and uploads the JSON report as an artifact. The docs make the contract explicit: this is an informational wall-time benchmark lane, not a heap/GC regression gate.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

The `examples/perf-gradient` demo runs in non-interactive mode and
produces measurable output. It could be adapted into a CI benchmark
that runs for a fixed number of frames and reports:

- Average view() time per frame
- Peak heap usage
- GC event count
- Total frame count in a fixed wall-clock window

A regression would show up as a measurable increase in view() time
or heap pressure across commits.

## Why

The perf demo proved that bijou's rendering bottleneck is in the
pipeline (differ + encode), not in the app. Any future optimization
(RE-008 byte-packed surface, RE-009 differ string fix) needs a
benchmark to validate the improvement. Running the benchmark in CI
prevents regressions from sneaking in.

## Shape

A non-interactive test that:
1. Creates a gradient app
2. Feeds it N tick messages
3. Asserts view() time stays below a threshold
4. Reports heap delta

Could live in `scripts/perf-bench.test.ts` or as a GitHub Action
that posts results as PR comments.

## Risks

- Terminal rendering in CI is headless — stdout.write still works
  but there's no terminal to parse the ANSI. The differ will still
  run but output goes to /dev/null.
- Wall-clock benchmarks are noisy in CI. Use statistical methods
  (median of N runs) not single-run thresholds.
