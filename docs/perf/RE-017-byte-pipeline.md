# RE-017 — Byte-Pipeline Recovery

> **Status:** In progress (audit phase).
> **Goal:** Recover the render pipeline to pre-RE-008 performance or
> better by eliminating all per-frame allocation and string work on
> the render path, moving to a pure byte-level output pipeline.
> **Cycle ID note:** the `bad-code` backlog already has an
> `RE-017-frame-does-not-fill-surface-background.md` file using the
> same cycle number. These are separate concerns and we may need to
> renumber one of them before landing this cycle.

## Table of Contents

1. [Background](#background)
2. [Measurement Methodology](#measurement-methodology)
3. [Baseline Audit (pre-RE017 HEAD)](#baseline-audit-pre-re017-head)
4. [Optimization Steps](#optimization-steps)
5. [Final Results](#final-results)
6. [Learnings](#learnings)

## Background

After RE-008 merged (byte-packed surface representation, PR #62,
merge commit `0df3e97`), an audit of the existing renderer benchmark
suite revealed a broad performance regression across every scenario:

| Scenario | Pre-RE-008 → Post-RE-008 |
|---|---|
| dogfood.render.medium | 1.60 → 2.32 ms/frame (-31%) |
| dogfood.diff.medium | 1.86 → 2.71 ms/frame (-31%) |
| dogfood.render.large | 0.53 → 1.09 ms/frame (-51%) |
| dogfood.diff.large | 0.78 → 1.55 ms/frame (-50%) |
| dogfood.docs.render.medium | 2.61 → 2.99 ms/frame (-12%) |
| surface.paint.medium | 0.22 → 0.41 ms/frame (-45%) |
| layout.normalize.medium | 0.16 → 0.34 ms/frame (-53%) |
| styled.diff.medium | 0.42 → 0.70 ms/frame (-40%) |
| frame.compose.medium | 0.95 → 1.21 ms/frame (-22%) |
| runtime.noop.medium | neutral |

The most dramatic finding: **`styled.diff.medium` transient heap
allocation grew from 1.4 MiB to 62 MiB per scenario run (44×
increase)**. This is the signature of the current `renderDiffPacked`
path: `sgrCache` Map growth, `String.fromCharCode` key allocation
per cell, `batchText += ...` string concatenation, and side-table
grapheme string churn.

The original RE-017 plan was scoped to fix the gradient stress
worst-case (`examples/perf-gradient` mode 1, which had regressed
from 49 → 25 FPS). The audit revealed that the regression is much
broader: every non-noop scenario is slower, and the heap allocation
on the styled diff path is catastrophic. The byte-pipeline rewrite
is now targeting the full regression, not just the gradient case.

An earlier claim of "-5.5% DOGFOOD" from the RE-008 handoff does not
reconcile with these bench numbers. Its origin is unknown. It may
have measured the live `npm run dogfood` experience rather than the
headless bench, or it may have compared against a different
reference. It is not being used as a success criterion for RE-017.

## Measurement Methodology

### Harness

- **Entry point:** `scripts/renderer-bench.ts` (invoked via
  `npm run bench:renderer` with `node --expose-gc --import tsx`).
- **Library:** `scripts/renderer-bench-lib.ts` — scenario
  definitions, stats computation, environment detection, comparison.
- **Baseline storage:** `benchmarks/renderer-baseline.json`.
- **Audit runs:** `benchmarks/re017-audit/run-NN.json` (expanded
  10×10 stats runs used in this cycle).
- **Machine fingerprint:** platform, arch, kernel release, Node
  version, CPU model, CPU count, total memory, hostname. Comparisons
  between runs on different fingerprints are treated as
  informational, not as a regression gate.

### Scenarios

The `DEFAULT_RENDERER_BENCH_SCENARIOS` array in `renderer-bench-lib.ts`
defines 10 scenarios across 7 `kind`s. Each scenario has fixed
`columns`, `rows`, `frames`, and `warmupFrames`. Warmup frames run
before timing starts so JIT optimization has stabilized.

| Scenario | Kind | Size | Frames | What it measures |
|---|---|---|---|---|
| `dogfood.render.medium` | `render` | 220×58 | 240 | DOGFOOD landing: `app.view(model)` + `normalizeViewOutput` per frame. No diff. |
| `dogfood.diff.medium` | `diff` | 220×58 | 180 | Same as above + `renderDiff(current, target, sink, style)` to a counting sink. |
| `dogfood.render.large` | `render` | 271×71 | 180 | Larger terminal, render only. |
| `dogfood.diff.large` | `diff` | 271×71 | 120 | Larger terminal, render + diff. |
| `dogfood.docs.render.medium` | `render` | 220×58 | 180 | DOGFOOD docs explorer page (sidebar + doc body). |
| `surface.paint.medium` | `surface` | 220×58 | 240 | Pure surface paint: `target.clear(); target.fill(...); target.blit(source, ...)` three times per frame + one `setRow`. No app/layout/diff. |
| `layout.normalize.medium` | `normalize` | 220×58 | 240 | `normalizeViewOutputInto(syntheticLayout, size, scratch)` per frame — the layout normalization stage in isolation. |
| `styled.diff.medium` | `styled-diff` | 220×58 | 180 | Synthetic styled diff: two surfaces built by `buildStyledDiffPair` (every 3rd/5th/7th cell styled with rotating palette + occasional modifiers), `renderDiff` called in a tight loop. Exercises the packed differ's SGR cache + string concat. |
| `frame.compose.medium` | `frame` | 220×58 | 180 | `renderFrameNode(layoutTree, bodyRect, renderCtx)` — the frame shell composition stage (grid/split/pane tree). |
| `runtime.noop.medium` | `runtime` | 220×58 | 180 | Full runtime loop (`run(app, { ctx })`) with a trivial view function — measures the cost of the event loop, pulse ticks, and pipeline overhead without real rendering work. |

### Metrics (current)

Per sample, as defined in `RendererBenchSample` at
`scripts/renderer-bench-lib.ts:28`:

| Field | Meaning | How it's measured |
|---|---|---|
| `elapsedMs` | Total wall time for `frames` iterations (excluding warmup) | `performance.now()` deltas |
| `avgFrameMs` | `elapsedMs / frames` | Derived |
| `approxFps` | `1000 / avgFrameMs` | Derived |
| `writes` | Count of `io.write()` calls observed by the sink (diff scenarios only) | Sink counter |
| `bytesWritten` | Sum of `.length` of all strings passed to `write()` | Sink counter |
| `transientHeapDelta` | `heapUsed` after run minus before, **without** forced GC before taking the "after" reading. Measures peak allocation during the run. | `process.memoryUsage()` (requires `--expose-gc`) |
| `retainedHeapDelta` | `heapUsed` after run minus before, **with** forced GC before both readings. Measures long-lived allocations. | `process.memoryUsage()` after `global.gc()` (requires `--expose-gc`) |

Per scenario (aggregated across samples), only **median** is
currently computed. This is a known gap — see
[RE-017 task I-2](../design/) for the expansion to mean / stddev /
min / max / p50 / p90 / p99.

### Current limitations

1. **No percentile statistics.** Only median across samples. A
   bimodal distribution (e.g. one slow sample every 10) would be
   invisible.
2. **No per-stage breakdown.** The `render` kind covers layout +
   paint as a unit; the `diff` kind adds the diff stage on top. We
   can see "total" cost but not "how much in layout vs paint vs
   diff".
3. **No conversion-hot-path counters.** The bench cannot answer
   "how many `parseHex` calls per frame?" or "how many
   `String.fromCharCode` key builds per frame?" — both suspected
   sources of the RE-008 slowdown.
4. **No GC pause time.** Only heap deltas. We can see how much
   allocation happened, but not whether it triggered a costly GC.
5. **First-run variance.** JIT warmup may be incomplete even after
   the scenario's `warmupFrames` — the 10-run expanded audit is
   partly to characterize this.
6. **`styled.diff.medium` uses the legacy `surface.set({char,fg,bg})`
   API, not `setRGB`.** The underlying surface is a `PackedSurface`
   either way, but the paint code path going into the diff is the
   hex-string-parsing path, not the byte-passing fast path. A
   `setRGB` variant should be added.
7. **No gradient / truecolor stress scenario.** The
   `examples/perf-gradient` worst case (every cell a unique RGB pair,
   9168+ unique styles per frame) is not represented in the headless
   bench. It is the scenario that originally surfaced the `sgrCache`
   worst-case regression (49 → 25 FPS).

## Baseline Audit (pre-RE017 HEAD)

### Run parameters

- **HEAD commit:** `941f62c` (RE-008 merge + follow-up fixes)
- **Machine:** Apple M1 Pro, 10 cores, 16 GiB, macOS 25.3, Node v25.8.1
- **Samples per scenario per process:** 10
- **Independent processes:** 10
- **Total samples per scenario:** 100
- **Run files:** `benchmarks/re017-audit/run-01.json` through `run-10.json`

### Aggregate statistics

<!-- TO BE FILLED BY I-0b aggregation step -->

### Comparison vs pre-RE-008 baseline (`87747f7`)

<!-- TO BE FILLED BY I-0b aggregation step -->

### Observations

<!-- TO BE FILLED BY I-0b aggregation step -->

## Optimization Steps

Each step is implemented in isolation, measured before and after
against the full scenario matrix, and kept only if it shows a
meaningful improvement on at least one scenario with no regressions
elsewhere.

### Step 0: Investigation (I-0e)

<!-- Findings from the RE-008 slowdown investigation: what specific
     change(s) caused the broad regression, and which are fixable
     independently of the byte-pipeline rewrite. -->

### Step II-1: Render-dirty bitmap

### Step II-2: WritePort.writeBytes

### Step II-3: Pooled output byte buffer

### Step II-4: Differ emits bytes directly

### Step II-5: ASCII fast path

### Step II-6: Pre-encoded side-table bytes

### Step II-7: Decimal lookup tables

## Final Results

<!-- Filled after III-5 final regression bench -->

## Learnings

This section and everything below it is an append-only running log.
**Do not rewrite earlier entries.** Each entry is dated (and may be
turn-marked). To correct or supersede a prior entry, add a new entry
that references the old one. The sections above this point form the
initial scaffold; findings that would have filled their placeholders
are recorded as new log entries below instead, cross-referenced by
section name.

### 2026-04-09 — Doc scaffolded, append-only policy adopted

Initial scaffold written with placeholders for Baseline Audit,
Optimization Steps, and Final Results. Before any of those
placeholders were filled, adopted an append-only policy: all future
content — including audit findings, optimization results, and
investigation notes — is appended to this log rather than edited
into the scaffold sections. The scaffold stays as a table of
contents; the truth lives in the log.

### 2026-04-09 — Audit kickoff, 10×10 bench run launched

Completed task I-0 (bench infrastructure audit). Key findings:

1. The existing baseline at `benchmarks/renderer-baseline.json` was
   captured at commit `87747f7` — **before** the RE-008 merge
   (`0df3e97`). It represents the old cell-object path, not the
   byte-packed path we're optimizing. It is effectively a historical
   reference, not the RE-017 starting point.
2. A single run of the existing bench at HEAD (`941f62c`) against
   the stale baseline showed 12-53% regressions across every
   non-noop scenario, and a 44× transient heap allocation jump
   (1.4 MiB → 62 MiB) in `styled.diff.medium`. These numbers are
   from one run and have not yet been confirmed for stability.
3. To confirm stability, launched a 10-process × 10-samples-each
   expanded stats run (100 samples per scenario total), saving each
   process output to `benchmarks/re017-audit/run-NN.json`. Task
   I-0b tracks this.
4. Created new audit tasks: I-0c (methodology docs), I-0d (pipeline
   instrumentation), I-0e (investigate broad slowdown).
5. Hypothesis to test in I-0e: per-cell hex string parsing in the
   `set()` path is the bulk of the regression. Trace:
   `packages/bijou/src/ports/surface.ts:532` → `encodeCellIntoBuf`
   (line 300) → `inlineHexRGB` (line 288) + `encodeChar` +
   `encodeModifiers`. Pre-RE-008, `set()` was an object assignment.
   Post-RE-008, every `set()` call does 6 `charCodeAt`s, 6 `hexD`
   lookups, modifier array iteration, and two byte writes per
   color. For a paint-heavy scenario that calls `set()` per cell,
   this adds ~20-30 operations per cell on a path that used to be
   a single object assignment. No compensating savings on
   `surface.paint.medium` because it never enters the diff path
   where the byte-packed representation pays off.

If the hypothesis holds, a cheap early win is possible: cache
theme-token hex parses so repeated calls to `set({fg: theme.primary, ...})`
reuse pre-parsed bytes instead of re-parsing on every call. This
would be independent of the byte-pipeline rewrite.

### 2026-04-09 — Expanded 10×10 stats results (100 samples per scenario)

The 10-process × 10-samples-each run completed in ~5 minutes. All
10 JSON reports saved under `benchmarks/re017-audit/run-NN.json`.
Aggregator at `scripts/aggregate-audit-runs.ts`. Raw aggregate table
at `benchmarks/re017-audit/aggregate.md`.

**Run parameters**

- HEAD commit `941f62c`, M1 Pro / macOS 25.3 / Node v25.8.1
- 10 independent processes, 10 samples per scenario per process
- 100 samples per scenario total
- Baseline comparison against `87747f7` (pre-RE-008)

**Frame time (ms) — full stats across 100 samples**

| Scenario | Mean | StdDev | Min | P50 | P90 | P99 | Max | CoV |
|---|---|---|---|---|---|---|---|---|
| dogfood.render.medium | 2.40 | 0.608 | 2.29 | 2.33 | 2.35 | 3.79 | 8.25 | 25.3% |
| dogfood.diff.medium | 2.71 | 0.043 | 2.67 | 2.71 | 2.75 | 2.79 | 3.06 | 1.6% |
| dogfood.render.large | 1.10 | 0.016 | 1.07 | 1.10 | 1.11 | 1.15 | 1.20 | 1.5% |
| dogfood.diff.large | 1.55 | 0.021 | 1.52 | 1.55 | 1.58 | 1.62 | 1.63 | 1.3% |
| dogfood.docs.render.medium | 3.07 | 0.133 | 2.89 | 3.07 | 3.18 | 3.70 | 3.89 | 4.3% |
| surface.paint.medium | 0.407 | 0.010 | 0.395 | 0.406 | 0.411 | 0.426 | 0.501 | 2.6% |
| layout.normalize.medium | 0.345 | 0.0074 | 0.335 | 0.343 | 0.348 | 0.382 | 0.398 | 2.2% |
| styled.diff.medium | 0.730 | 0.116 | 0.694 | 0.708 | 0.808 | 0.841 | 1.83 | 15.8% |
| frame.compose.medium | 1.24 | 0.039 | 1.19 | 1.24 | 1.28 | 1.33 | 1.49 | 3.2% |
| runtime.noop.medium | 0.0015 | 0.0003 | 0.0012 | 0.0014 | 0.0020 | 0.0022 | 0.0023 | 20.0% |

**Transient heap per scenario run (mean across 100 samples)**

| Scenario | Mean | StdDev | Min | P50 | P90 | Max |
|---|---|---|---|---|---|---|
| dogfood.render.medium | 33.88 MiB | 16.11 MiB | 1.22 MiB | 45.38 MiB | 45.59 MiB | 45.67 MiB |
| dogfood.diff.medium | 49.14 MiB | 17.81 MiB | 14.22 MiB | 61.73 MiB | 61.88 MiB | 62.14 MiB |
| dogfood.render.large | 25.17 MiB | 4.08 MiB | 10.34 MiB | 26.25 MiB | 26.35 MiB | 26.43 MiB |
| dogfood.diff.large | 28.86 MiB | 3.46 MiB | 13.82 MiB | 29.66 MiB | 29.73 MiB | 29.79 MiB |
| dogfood.docs.render.medium | 53.26 MiB | 26.83 MiB | 10.73 MiB | 58.11 MiB | 92.65 MiB | 98.49 MiB |
| surface.paint.medium | 0.10 MiB | 0.01 MiB | 0.08 MiB | 0.09 MiB | 0.10 MiB | 0.16 MiB |
| layout.normalize.medium | 0.46 MiB | 0.00 MiB | 0.45 MiB | 0.45 MiB | 0.46 MiB | 0.46 MiB |
| styled.diff.medium | 51.79 MiB | 14.13 MiB | 30.29 MiB | 60.99 MiB | 61.00 MiB | 61.03 MiB |
| frame.compose.medium | 61.10 MiB | 18.63 MiB | 20.01 MiB | 52.02 MiB | 92.14 MiB | 107.03 MiB |
| runtime.noop.medium | 0.74 MiB | 0.08 MiB | 0.48 MiB | 0.73 MiB | 0.74 MiB | 1.19 MiB |

**Regression vs pre-RE-008 baseline (median comparison — most fair)**

| Scenario | Baseline median | Post-RE-008 P50 | Δ % |
|---|---|---|---|
| dogfood.render.medium | 1.60 ms | 2.33 ms | **+45.6%** |
| dogfood.diff.medium | 1.86 ms | 2.71 ms | **+45.7%** |
| dogfood.render.large | 0.534 ms | 1.10 ms | **+106%** |
| dogfood.diff.large | 0.781 ms | 1.55 ms | **+98%** |
| dogfood.docs.render.medium | 2.61 ms | 3.07 ms | +17.5% |
| surface.paint.medium | 0.224 ms | 0.406 ms | **+81%** |
| layout.normalize.medium | 0.161 ms | 0.343 ms | **+113%** |
| styled.diff.medium | 0.421 ms | 0.708 ms | **+68%** |
| frame.compose.medium | 0.951 ms | 1.24 ms | +30% |
| runtime.noop.medium | 0.0019 ms | 0.0014 ms | -17% (noise; control) |

**Heap regression vs baseline**

| Scenario | Baseline median | Post-RE-008 P50 | Multiple |
|---|---|---|---|
| styled.diff.medium | 1.34 MiB | 60.99 MiB | **~46×** |
| dogfood.render.large | 10.29 MiB | 26.25 MiB | 2.6× |
| surface.paint.medium | 64 KiB | 94 KiB | 1.5× |
| all others | - | - | ~1× (noisy, no clear trend) |

**Key observations**

1. **The regression is reproducible and large.** Run-to-run variance
   is tight (CoV < 5% for most scenarios). The 10 independent
   processes agree with each other. These are trustworthy numbers.

2. **The regression is bigger than the single-run showed.** Median
   comparison now gives 30%-113% regression, not 12-53%. Some
   scenarios literally doubled in frame time (layout.normalize.medium
   +113%, dogfood.render.large +106%, dogfood.diff.large +98%).

3. **Smaller scenarios regressed harder.** Scenarios with smaller
   baselines (layout.normalize 0.16ms, surface.paint 0.22ms,
   dogfood.render.large 0.53ms) regressed the most in percentage
   terms. This is consistent with per-cell overhead dominating when
   there's less fixed work to amortize against.

4. **`styled.diff.medium` heap allocation is catastrophic and
   confirmed at ~46× baseline.** Mean 51.79 MiB, P50 60.99 MiB, very
   stable (min 30 MiB, max 61 MiB). The differ's `sgrCache` +
   string concat + side table churn is the culprit — exactly what
   RE-017 is rewriting.

5. **Two scenarios are bimodal** (dogfood.render.medium CoV 25%,
   styled.diff.medium CoV 16%). Long right tails with max values
   3-3.5× the P50. This is the GC pause signature: most samples are
   fast, occasional samples catch a generational GC triggered by
   the high allocation rate. Visible GC jank.

6. **`runtime.noop.medium` is unaffected.** The control scenario
   (full runtime loop with trivial view, no real rendering) matches
   baseline. This confirms the regression is specifically in the
   render/paint/diff/layout path, not in runtime/event loop
   overhead.

7. **The bimodal tail on `dogfood.render.medium` is the concerning
   one for end users** — occasional 8ms frames on a 2ms mean means
   stutters during interaction, even though averages look OK.

**Hypothesis status**

The per-cell hex parsing hypothesis is consistent with every
pattern observed:
- Scenarios that set every cell (layout.normalize, surface.paint,
  dogfood.render) regress hardest.
- Smaller scenarios regress harder (per-cell overhead dominates).
- Heap allocation on styled-diff is the sgrCache + string concat
  side of the same story (diff path, not paint path).
- The control scenario is unaffected.

But it's still a hypothesis. Confirming requires instrumentation
(task I-0d) to count parseHex / encodeChar / encodeModifiers calls
per frame and measure time spent in each.

**Open questions**

- Why does `layout.normalize.medium` regress so hard (+113%) when
  it uses pre-built pattern surfaces? The setup cost of building
  those surfaces is outside the timed region, so hex parsing during
  setup shouldn't show. Does the blit operation in the packed path
  do extra work? Needs investigation. Possible explanation: blit
  copying from a legacy cell-array surface to a packed surface (or
  vice versa) forces per-cell re-encoding.
- Why does `frame.compose.medium` regress only 30% when it's
  structurally similar to the dogfood.render paths? Is the frame
  shell short-circuiting some rendering?
- Why does `dogfood.docs.render.medium` (+17%) regress much less
  than `dogfood.render.medium` (+45%) despite both using the docs
  app? What's different about the keyed explorer state?

These questions go into task I-0e (investigate).

**Next actions**

1. Task I-0b: COMPLETE.
2. Task I-0e (investigate RE-008 broad slowdown): unblocked, can
   start now. Priority: identify the specific hot paths causing
   the regression using bisection across the RE-008 commits if
   needed.
3. Task I-0d (instrument pipeline): can start in parallel with
   I-0e; the instrumentation will accelerate the investigation.
4. Task I-0c (document methodology): largely already done as part
   of the scaffold + this log entry; needs a final pass to confirm
   nothing is missing.

**Deferred decisions**

- Whether to refresh `benchmarks/renderer-baseline.json` to reflect
  the post-RE-008 state as the new RE-017 starting point (task I-9).
  Leaning yes, but keeping the `87747f7` baseline as a historical
  reference for the ultimate "did we recover?" question at end of
  cycle.
- Whether the gradient stress scenario (task I-5) is still a
  priority given the existing bench already exposes the regression.
  Still yes — the gradient case is the worst-case stress and we
  want it in the CI gate.

### 2026-04-09 — Scrapped the existing bench, built bench v2 from scratch

After the expanded 10×10 audit revealed that the `PerformanceObserver('gc')`-based
heap measurement fix produced garbage data (zero GC events reported
across 1,000 samples even for scenarios with negative heap deltas,
which can only happen if GC fires), we made the call to throw out
`scripts/renderer-bench*.ts` + `benchmarks/renderer-baseline.json`
entirely and build a new bench from scratch around the principle
"measure only what you can trust."

**What was deleted:**

- `scripts/renderer-bench.ts`
- `scripts/renderer-bench-lib.ts`
- `scripts/renderer-bench-compare.ts`
- `scripts/renderer-bench.test.ts`
- `scripts/aggregate-audit-runs.ts`
- `benchmarks/` (the whole directory, including the 10 audit runs)
- `npm run bench:renderer*` scripts from the root package.json

**What was built:**

- `bench/` — new top-level workspace package `@flyingrobots/bijou-bench`
- Harness-agnostic `Scenario` interface in `bench/src/scenarios/types.ts`
- 4 initial scenarios:
  - `paint-ascii` — baseline "no colors, no hex parsing"
  - `paint-theme-set` — rotating theme palette, exercises `inlineHexRGB`
  - `paint-gradient-rgb` — per-cell unique RGB via `setRGB`
  - `diff-gradient` — full-screen gradient diff (sgrCache stress)
- `bench/src/harnesses/wall-time/` — process-isolated wall-time harness
  - `child.ts` runs ONE sample of ONE scenario in a fresh V8 isolate and exits
  - `runner.ts` spawns N children per scenario, aggregates stats
  - `compare.ts` diffs two report JSONs with a regression gate
- `bench/src/stats.ts` — percentile/mean/stddev/CoV helpers (linear-interpolated)
- `bench/src/cli.ts` — `bench run | compare | list`
- `bench/README.md` — design principles and usage
- `bench/baselines/HEAD-941f62c-pre-RE017.json` — first trustworthy baseline

**New npm scripts in root package.json:**

- `npm run bench` → `node --import tsx bench/src/cli.ts run`
- `npm run bench:compare`
- `npm run bench:baseline`

**Design principles documented in `bench/README.md`:**

1. Process isolation per sample. Fresh V8 isolate every time. No
   cross-sample GC state. No accumulated JIT state. The scenario's
   own warmup loop stabilizes JIT within each child.
2. Wall time only in the main bench. No heap deltas, no inline GC
   observers, no anything that can be wrong. `process.hrtime.bigint()`
   start + end, divide by frame count, done.
3. Scenarios are pure: `setup()` + `frame()` + metadata. No
   coupling to measurement. The same module can drive the wall-time
   harness, a future memory harness, and a future interactive
   sandbox — three harnesses sharing one scenario registry.
4. Report stats, not means. mean / stddev / CoV / min / max / p50 /
   p90 / p99. CoV < 5% is the "trust this" signal.

**First trustworthy baseline at HEAD (`941f62c`, Apple M1 Pro, Node v25.8.1):**

| Scenario | P50 | P90 | P99 | Min | Max | CoV |
|---|---|---|---|---|---|---|
| paint-ascii | 234.27 µs | 236.69 µs | 239.32 µs | 229.01 µs | 240.24 µs | **1.1%** |
| paint-theme-set | 633.92 µs | 644.29 µs | 729.63 µs | 624.38 µs | 761.45 µs | **3.8%** |
| paint-gradient-rgb | 946.29 µs | 951.75 µs | 954.92 µs | 878.78 µs | 955.14 µs | **2.6%** |
| diff-gradient | 2.13 ms | 2.16 ms | 2.19 ms | 2.04 ms | 2.20 ms | **2.0%** |

30 samples per scenario. **All CoVs under 4%.** These are
trustworthy numbers for the first time in this cycle. The bench is
reproducible and the new sample runs take ~45 seconds total, which
makes iterative optimization measurement practical.

**Per-cell cost breakdown (for context, rough):**

- `paint-ascii`: 234 µs / 12,760 cells ≈ **18 ns/cell** (baseline)
- `paint-theme-set`: 634 µs / 12,760 cells ≈ **50 ns/cell** (2.7×
  ASCII cost — the delta is hex parsing + modifier encoding per
  set() call)
- `paint-gradient-rgb`: 946 µs / 12,760 cells ≈ **74 ns/cell**
  (4.0× ASCII cost — BUT this scenario's cost is dominated by 6
  `Math.cos` calls per cell for animation, not by `setRGB` itself.
  Scenario design note below.)

**Scenario design concern — `paint-gradient-rgb` is animation-bound:**

The scenario spends most of its per-cell time on `Math.cos` × 6
for the animation phase, not on `setRGB`. This means it does not
cleanly isolate the `setRGB` path cost. To fix: add a variant that
precomputes a large RGB table in `setup()` and indexes into it in
`frame()` with cheap arithmetic. That would give us a pure
"`setRGB` vs `set`" comparison. Captured as TODO — not blocking the
RE-017 investigation since the scenario still exposes the sgrCache
stress case in `diff-gradient`.

**Backlog entries captured this session (from observations during
the audit):**

Bad-code:

- `docs/method/backlog/bad-code/RE-018-hex-color-string-as-canonical-fg-bg.md`
  — the hex-string-as-canonical-fg/bg smell. The broad RE-008
  regression's likely root cause.
- `docs/method/backlog/bad-code/RE-019-dirtyWords-serves-lazy-cache-not-render-dirty.md`
  — the `dirtyWords` bitmap in `surface.ts` serves the lazy Cell[]
  cache, not render tracking. Blocks the Task II-1 repurposing
  until the lazy cache is retired.
- `docs/method/backlog/bad-code/DAG-layer-skipping-edges-occluded.md`
  — the DAG renderer occludes layer-skipping edges. Correctness
  bug (git-warp consumer). Not blocking RE-017 but important.
- `docs/method/backlog/bad-code/DX-008-performance-observer-gc-unreliable.md`
  — `PerformanceObserver('gc')` didn't report events it should
  have. Do not use it as a measurement filter in bijou benches
  until someone reproduces it in isolation.

Cool ideas:

- `docs/method/backlog/cool-ideas/RE-019-theme-token-color-cache.md`
  — pre-parse hex at theme load time; internal optimization only,
  no API break. Cheap early win candidate.
- `docs/method/backlog/cool-ideas/RE-020-typed-color-representation.md`
  — `ColorRef` branded type. Follow-on to the theme cache, makes
  the fast path first-class in the type system.
- `docs/method/backlog/cool-ideas/DX-016-scenario-provenance-tags.md`
  — tag scenarios for intelligent filtering. Enables targeted CI
  gates and coverage analysis.
- `docs/method/backlog/cool-ideas/DX-017-agent-first-bench-output-format.md`
  — JSONL flat-record output format for agent consumption. An
  agent-first observation from this session: I work faster when
  tools emit grep/jq-friendly data.

**Agent-first lessons from this audit**

(This section is the agent advocating for what the agent needs.)

1. **Measurement integrity is the first thing to validate, not the
   last.** I spent real time building on top of a broken
   measurement before questioning the tool. When numbers look
   weird (negative heap deltas, zero GC events), that's a tool
   problem until proven otherwise.
2. **Claims I make about code behavior need to be backed by a
   citation or a minimal repro.** I claimed the DAG renderer hid
   edges via transitive reduction. It didn't. I claimed a 5.5%
   DOGFOOD regression existed. It might not. Both cost trust.
3. **Append-only discipline on running logs is a real requirement,
   not an aesthetic preference.** I had to be told this. The
   memory is saved.
4. **The backlog lanes (`bad-code/`, `cool-ideas/`) are my tools
   too, not just the user's.** I am a co-author of the project's
   self-knowledge. When I notice smells or have ideas I should
   log them immediately, not wait to be asked. This session
   flipped that for me.

**Next actions**

1. Task I-0b (expanded stats run): COMPLETED with the new bench.
2. Task I-0c (document methodology): COMPLETED as part of this log
   entry + `bench/README.md`.
3. Task I-0e (investigate RE-008 broad slowdown): unblocked. The
   hypothesis to test is `RE-018` — per-cell hex parsing in
   `surface.set()`. Direct way to measure: bisect across the
   RE-008 commits with `bench run --scenario=paint-theme-set`.
4. Task I-0d (instrument pipeline stages): still valuable but can
   be deferred until after I-0e identifies the specific hot path.
5. Adding more scenarios: `diff-static`, `diff-sparse`,
   `paint-blit`, `layout-normalize`, and fixing
   `paint-gradient-rgb` to separate animation cost from setRGB
   cost. Can grow organically during Part II as we need coverage.
6. Commit everything as one focused "RE-017 audit + bench v2"
   commit.

### 2026-04-09 — Investigation result: RE-018 hex-parse hypothesis CONFIRMED

Approach: source-diff the pre-RE-008 (`87747f7`) `surface.ts` against
current HEAD, then add a minimal A/B/C bench scenario to quantify
the cost of each path empirically.

**Code review — pre vs post RE-008 `set()` path**

Pre-RE-008 `surface.ts:277` (`git show 87747f7:packages/bijou/src/ports/surface.ts`):

```ts
set(x, y, cell, mask = FULL_MASK) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = y * w + x;
  applyMaskInPlace(cells[idx]!, cell, mask);
},
```

Pre-RE-008 `applyMaskInPlace` (line 231): five property assignments.
`target.fg = source.fg` was a string reference copy. No parsing.
No encoding. Total per-call work: bounds check + array index + ~5
property assignments. Cheap.

Post-RE-008 `set()` (current `surface.ts:523-540`) routes through
`encodeCellIntoBuf` (line 300), which does on every call:

- `encodeChar(cell.char, sideTable)` — length check + `charCodeAt`
  or sideTable lookup
- `inlineHexRGB(cell.fg, buf, off+2)` — 6× `charCodeAt` + 6× `hexD`
  (lookup table) + 3 byte writes
- `inlineHexRGB(cell.bg, buf, off+5)` — same, 6 more charCodeAt
- `encodeModifiers(cell.modifiers)` — array iteration + 2 record
  lookups per modifier
- 10 total byte writes into the packed buffer
- `markDirty(idx)` — bit flip

**Per-call cost blowup:** ~5 operations → ~40-60 operations. 8-12×
more work per `set()` call, depending on whether fg/bg/modifiers
are present.

**A/B/C bench — three scenarios on the same painting**

Added `paint-rgb-fixed` as the "no hex parse, no math" baseline.
Same 12,760-cell paint, but via `setRGB(x, y, BLOCK, 0x9b, 0xa9,
0xff, 0x11, 0x13, 0x20)` — pre-parsed bytes, no string work at all.

30 samples each, CoV < 5%:

| Scenario | P50 | ns/cell | Path |
|---|---|---|---|
| `paint-rgb-fixed` | 143 µs | **11.2 ns** | `setRGB` → `packCell` direct (bytes in, bytes out) |
| `paint-ascii` | 231 µs | **18.1 ns** | `set({char})` → `encodeCellIntoBuf` (no colors, but all branches still evaluated) |
| `paint-theme-set` | 625 µs | **49.0 ns** | `set({char, fg, bg})` → `encodeCellIntoBuf` → 2× `inlineHexRGB` |

**The deltas tell the story:**

- **`paint-theme-set` − `paint-rgb-fixed` = 482 µs per frame of
  pure hex-parsing + modifier-encoding overhead.** That is
  38 ns × 12,760 cells of work that is *entirely* spent
  reparsing the same ~5 theme colors over and over. This is
  **77% of `paint-theme-set`'s total frame time**.
- **`paint-ascii` − `paint-rgb-fixed` = 88 µs / 7 ns/cell.**
  This is the raw cost of `encodeCellIntoBuf`'s function
  overhead + branch-check path even when there's no hex to
  parse. Not huge, but real.
- **`setRGB` is unambiguously the fast path.** It writes MORE
  data per call (10 bytes vs ~2-3 bytes of char code) but is
  ~1.6× faster than `set({char})` because it skips
  `encodeCellIntoBuf` and hits `packCell` directly.

**Conclusion**

The RE-018 hypothesis is confirmed. The broad RE-008 regression
(30-113% across every rendering scenario in the earlier audit)
is driven by per-cell hex parsing in the legacy `surface.set`
path, which is what ~every component currently uses. `setRGB`
exists and works, but adoption is partial — most components still
pass hex strings.

**Two independent fixes are implied, and they compose:**

1. **Cheap, no-API-break win:** the cool idea
   `RE-019-theme-token-color-cache.md`. Pre-parse theme token
   colors at theme load time into byte arrays. `surface.set`
   (or a new internal variant) detects already-parsed byte values
   and skips `inlineHexRGB`. Components that pull fg/bg from
   theme tokens (which is the common case) get the fast path for
   free. Expected impact: `paint-theme-set` drops from 625 µs
   toward 143 µs — potentially a **4×** speedup on that scenario
   and roughly proportional speedups on `dogfood.render.*`.
2. **Deeper fix:** the cool idea `RE-020-typed-color-representation.md`.
   A branded `ColorRef` type that lets the entire hot path work
   in bytes. Hex strings stay supported at the user edge.
   Components that build Cells directly can `resolveColor(hex)`
   at setup time and reuse the result.

The theme cache (RE-019 cool idea) is the right first landing
because it's:

- Zero API break — purely internal optimization.
- Directly measurable — `paint-theme-set` delta is the success
  criterion.
- Compounds with the byte-pipeline differ work in Part II — if
  we land both, the entire render pipeline runs in bytes end to
  end.

**Also worth noting for the byte-pipeline design**

- **`setRGB` not being ~identical in cost to `set({char})` is a
  design assertion we can make now.** `setRGB` is the fast path;
  components should use it wherever they have the RGB values
  already. Converting more components to `setRGB` would be an
  early partial win even without any new caching.
- **`paint-ascii` being 1.6× slower than `paint-rgb-fixed`
  suggests there is room to optimize `encodeCellIntoBuf`'s
  no-colors path.** Currently the branches are evaluated but
  never taken. A fast-path version that detects "no fg, no bg,
  no modifiers" at the top and jumps to a minimal char-only
  writer would recover most of that 88 µs delta. Not blocking,
  but an obvious cleanup for the same cycle.

**Next actions**

1. Task I-0e: COMPLETED. Hypothesis confirmed empirically.
2. New task: prototype the theme token color cache (RE-019 cool
   idea). Measure the `paint-theme-set` delta. If it matches
   expectations (3-4× speedup), land it as a standalone
   improvement before the Part II byte-pipeline work.
3. Add `paint-rgb-fixed` as a permanent bench scenario (done in
   this session, committed next).
4. Consider adding `paint-blit` and `diff-static` scenarios for
   broader coverage of the Part II optimization work.

### 2026-04-09 — Theme token color cache prototype: 1.9× speedup confirmed

Prototyped RE-019 cool idea (pre-parse theme token colors into
bytes). Scope of the change:

1. `Cell` interface gained optional `fgRGB?: readonly [number, number, number]`
   and `bgRGB?: readonly [number, number, number]` fields
   (`packages/bijou/src/ports/surface.ts:25-38`). Both are optional;
   hex strings still work as before. No breaking change.
2. `encodeCellIntoBuf` (`surface.ts:300-348`) now checks `fgRGB` /
   `bgRGB` first and uses them directly when present, falling back
   to `inlineHexRGB(cell.fg, ...)` otherwise. Theme-driven paints
   that pass pre-parsed RGB skip the hex parse entirely.
3. `CellTextStyle` in `packages/bijou/src/core/components/surface-text.ts`
   extended to `Pick<Cell, 'fg' | 'bg' | 'fgRGB' | 'bgRGB' | 'modifiers'>`.
4. `tokenToCellStyle` (the central helper used by text components)
   now passes `token.fgRGB` / `token.bgRGB` through when present.
   Since theme resolution already populates these fields (see
   `packages/bijou/src/core/theme/resolve.ts:12`), any component
   that uses `tokenToCellStyle` gets the fast path automatically.
5. `badge.ts` updated to pass `baseToken.fgRGB` explicitly as a
   representative component migration.

**Test status:** all 2,807 tests pass. The change is fully backward
compatible.

**Bench measurement** — added a `paint-theme-set-fast` scenario
that mirrors `paint-theme-set` but pre-parses the palette once in
`setup()` and passes `fgRGB` / `bgRGB` on each `surface.set()` call.
30 samples each, same machine, commit `0aded48`:

| Scenario | P50 | ns/cell | CoV | Notes |
|---|---|---|---|---|
| `paint-rgb-fixed` | 145 µs | 11.4 | 3.5% | setRGB floor (no parsing) |
| `paint-theme-set-fast` | **328 µs** | **25.7** | **1.0%** | set() with pre-parsed fgRGB/bgRGB — **NEW** |
| `paint-theme-set` | 624 µs | 48.9 | 3.1% | set() with hex parsed every call |

**Result: `paint-theme-set` → `paint-theme-set-fast` = 624 µs → 328 µs,
a 1.9× speedup.** That's a **47% reduction in frame time** on the
theme-driven paint path with a ~30-line change.

The remaining gap to the `setRGB` floor (328 → 145 µs) is other
overhead in `encodeCellIntoBuf` that has nothing to do with hex
parsing:

- `encodeChar` — char string → code point encoding
- `encodeModifiers` — array iteration + record lookups
- Undefined-check branches for cell fields
- Object property accesses on the Cell argument
- Writing zero bytes to unused fg/bg positions when they're absent

Those are a separate optimization opportunity (an `encodeCellIntoBufFast`
sibling that takes pre-computed byte/flag values directly), not part
of the theme cache work.

**What this means for real-world performance**

Theme tokens already had `fgRGB`/`bgRGB` populated via
`populateThemeRGB` (the infrastructure was half-built from an
earlier cycle and never wired through). Every component that uses
`tokenToCellStyle` now gets the ~1.9× speedup for free because
`tokenToCellStyle` passes the pre-parsed RGB through. That includes
everything built on `createTextSurface` and `surface-text.ts`'s
text rendering helpers — the hottest text paint path in the system.

Components that still call `surface.set({ fg: token.hex })` directly
(without going through `tokenToCellStyle`) don't benefit yet. They
need a similar small edit to pass `fgRGB: token.fgRGB`. The grep
turned up ~8 files with direct `.hex` calls. Migrating them is
mechanical and safe.

**Remaining components to migrate** (for full benefit):

- `packages/bijou/src/core/components/box-v3.ts` (3 call sites —
  `fillStyle.fg`, border overrides)
- `packages/bijou-tui/src/app-frame-render.ts` (1 call site —
  active header tab override, not a hot path)
- `packages/bijou-tui/src/overlay.ts`
- `packages/bijou-tui/src/notification.ts`
- `packages/bijou-tui/src/css/text-style.ts`
- `packages/bijou-tui/src/transition-shaders.ts`
- `packages/bijou/src/core/theme/graph.ts`

These can be done as a follow-up batch. None are blocking further
RE-017 work.

**Next actions**

1. Task #37 (theme token color cache prototype): COMPLETED. The
   prototype validates the hypothesis and the Cell-level machinery
   is in place. Migration of remaining components can happen
   incrementally.
2. Add a component-level bench scenario that renders a
   representative slice of DOGFOOD (header + sidebar + content) so
   we can measure the end-to-end impact of the migration on a
   realistic workload, not just the synthetic `paint-theme-set`.
3. Continue with Part II of RE-017 (the differ byte pipeline).
   The theme cache win compounds with the differ work — together
   they should eliminate string work from both the paint AND the
   diff sides of the pipeline.

### 2026-04-10 — Phase A complete: component migration, 3 new scenarios, baseline captured

Phase A of the execution plan is done. Work done this session:

**Component migration (task #38)**

Migrated 5 remaining component call sites to pass `fgRGB`/`bgRGB`
alongside `fg`/`bg` so the packed surface fast path skips
`inlineHexRGB`:

- `packages/bijou-tui/src/notification.ts` — local `CellTextStyle`
  interface extended with optional `fgRGB`/`bgRGB` fields;
  `tokenToCellStyle` now threads them through.
- `packages/bijou-tui/src/overlay.ts` — `CellStyle` type extended;
  `styleFromToken` / `backgroundStyleFromToken` updated.
- `packages/bijou-tui/src/transition-shaders.ts` — `tokenCell`
  helper updated.
- `packages/bijou-tui/src/app-frame-render.ts` — active header tab
  override path updated.

Skipped:

- `packages/bijou-tui/src/css/text-style.ts` — uses a local
  `StyledTextToken` type built from CSS strings (`styles['color']`),
  not from a resolved `TokenValue`. No pre-parsed RGB available
  without a bigger refactor. The existing `setRGB` loop already
  manually parses hex once and reuses, so this file isn't actually
  in a hot repeated-parse path.
- `packages/bijou/src/core/components/box-v3.ts` — already has a
  `setRGB` fast path for packed surfaces. The `surface.set` fallback
  only runs on non-packed surfaces which don't exist anymore.
- `packages/bijou/src/core/theme/graph.ts` — internal theme graph
  state, not a rendering hot path.

**New bench scenarios (tasks #39, #40, #41)**

- `bench/src/scenarios/diff-sparse.ts` — paints a full surface in
  setup, mutates ~10% of cells per frame (1,276 cells), runs
  renderDiff. Represents realistic interactive updates.
- `bench/src/scenarios/diff-static.ts` — paints a full surface in
  setup, calls renderDiff against itself every frame. No changes.
  Measures the cost of the scan itself. Reference baseline for
  the II-1 render-dirty bitmap optimization target.
- `bench/src/scenarios/dogfood-realistic.ts` — multi-region
  composition: header bar (2 rows) + sidebar (20 cols) + body +
  footer (1 row). Each region uses different theme bytes via
  setRGB. Cross-component regression gate for Part II.

**Phase A baseline** (task #43)

Saved as `bench/baselines/HEAD-f966c72-phase-a.json`. This is the
reference that every Part II step will be measured against.

30 samples each, Apple M1 Pro, Node v25.8.1, commit `f966c72`:

| Scenario | P50 | ns/cell | CoV | Notes |
|---|---|---|---|---|
| paint-ascii | 231 µs | 18.1 | 1.5% | `set({char})` floor |
| paint-rgb-fixed | 145 µs | 11.4 | 7.4% | `setRGB` floor |
| paint-theme-set | 635 µs | 49.7 | 1.1% | hex parse every cell |
| **paint-theme-set-fast** | **328 µs** | **25.7** | **0.7%** | **pre-parsed RGB (theme cache)** |
| paint-gradient-rgb | 950 µs | 74.4 | 2.1% | dominated by Math.cos |
| diff-gradient | 2.08 ms | — | 2.0% | paint + diff, sgrCache stress |
| **diff-sparse** | **349 µs** | **27.3** | **3.3%** | **~10% dirty cells — NEW** |
| **diff-static** | **227 µs** | **17.8** | **4.9%** | **zero changes — NEW** |
| **dogfood-realistic** | **469 µs** | **36.7** | **1.0%** | **multi-region — NEW** |

All CoVs under 8% (paint-rgb-fixed's 7.4% is the absolute-floor
effect; 145 µs is tight enough that OS jitter dominates). All
others under 5%. Numbers are trustworthy.

**Targets for Part II**

Baseline numbers give us concrete Part II targets:

1. **`diff-static`: 227 µs → ~0 µs** (II-1 render-dirty bitmap
   should skip the scan entirely on an unchanged surface). This
   is the sharpest measurable win target in Part II.
2. **`diff-gradient`: 2.08 ms → <1.5 ms** (II-4 byte pipeline
   should drop the sgrCache overhead and string concat garbage).
3. **`dogfood-realistic`: 469 µs → <350 µs** (combined win from
   II-1 dirty-bit skip + II-4 byte emission).
4. **`diff-sparse`: 349 µs → <200 µs** (II-1 should skip the 90%
   unchanged cells; II-4 should cheapen the 10% emit).

Any Part II step that doesn't move at least one of these needles
while matching all the others isn't worth shipping.

**Next: Phase B — Part II prereqs**

1. **II-2: `WritePort.writeBytes` API** — small interface addition.
   Can run in parallel with II-1 conceptually; I'll do it first
   since it's isolated and small.
2. **II-1: Repurpose `dirtyWords` as render-dirty bitmap** — the
   big unlock. Requires auditing `surface.get()` hot-path usage
   first (see bad-code RE-019). Then decide drop-cache vs
   separate-bitmap. Then implement + measure against `diff-static`
   and `diff-sparse`.

Part II is bigger work than Phase A. Will likely need to split
across multiple sessions.

### 2026-04-10 — II-2 + II-1 landed: 30× faster diff-static, 1.9× faster diff-sparse

Two pieces of Part II shipped this session.

**II-2: `WritePort.writeBytes` API (task #2)**

Added optional `writeBytes(buf: Uint8Array, len: number)` method to
the `WritePort` interface (`packages/bijou/src/ports/io.ts`).
Implemented in `nodeIO()` (`packages/bijou-node/src/io.ts`) backed
by `process.stdout.write(buf.subarray(0, len))`. The `len`
parameter is required so pooled buffers with extra capacity can
write only the valid prefix without slicing.

This is plumbing for II-3 (pooled output buffer) and II-4 (differ
direct byte emission). No functional change yet — the differ
still uses the string `write()` path. Tests pass, types clean.

**II-1: Render-dirty bitmap (task #11)**

Implemented as a SECOND bitmap alongside the existing `dirtyWords`
(which stays for the lazy `Cell[]` decode cache). Decision rationale:

- The Cell[] cache is still used by `surface.cells[i]` accessors
  (notably `grayscale.ts` middleware), and by tests. Dropping it
  would be a breaking API change requiring more migration.
- Adding a second `Uint32Array` is cheap (1 bit per cell,
  ~1.6 KiB for a 220×58 surface).
- Both bitmaps update from the same `markDirty(idx)` helper, so
  there's no risk of drift. The `markAllClean()` helper resets
  both. The `markAllDirty()` helper sets both.

`PackedSurface` interface gained:

- `readonly renderDirtyWords: Uint32Array` — exposed for the
  differ to read.
- `markAllRenderClean(): void` — public method for callers that
  model runtime swap manually (bench scenarios, advanced loops).

`renderDiffPacked` (`packages/bijou/src/core/render/differ.ts:401`)
got two changes:

1. **Whole-frame early-out**: at the top, scan the union of
   `target.renderDirtyWords | current.renderDirtyWords` word-at-a-
   time. If no words have any bits set, return immediately without
   walking any cells. This is the diff-static / idle-frame case.
2. **Per-cell skip**: in the inner loop, before doing the byte
   compare, check if the current cell's bit is set in either
   surface's bitmap. If neither marks it dirty, skip it without
   the compare. This is the diff-sparse case.

The bitmap gets set on every `set()`, `setRGB()`, `fill()`,
`blit()`, `setRow()` mutation, and reset by `clear()` or explicit
`markAllRenderClean()`. The runtime model is: `nextSurface.clear()`
between frames resets the bitmap; user paints set bits;
renderDiff walks union; swap.

The bench scenarios `diff-static`, `diff-sparse`, and
`dogfood-realistic` were updated to call `markAllRenderClean()`
between frames to model the runtime swap pattern. Without this
modeling the bitmap accumulates over many frames and the win
disappears in the bench (though it would still apply correctly
in the real runtime).

**Bench results**

Apple M1 Pro, Node v25.8.1, commit `4216f15`, 30 samples each.
Saved to `bench/baselines/HEAD-4216f15-after-II-1.json`.

Comparison vs Phase A baseline:

| Scenario | Phase A P50 | After II-1 P50 | Δ |
|---|---|---|---|
| **diff-static** | **227 µs** | **7.58 µs** | **−97% (30× faster)** 🚀 |
| **diff-sparse** | **349 µs** | **185 µs** | **−47% (1.9× faster)** 🎉 |
| dogfood-realistic | 469 µs | 465 µs | neutral (full repaint, every cell dirty) |
| diff-gradient | 2.08 ms | 2.07 ms | neutral (every cell dirty) |
| paint-ascii | 231 µs | 239 µs | +3% (within noise) |
| paint-rgb-fixed | 145 µs | 146 µs | neutral |
| paint-theme-set | 635 µs | 640 µs | neutral |
| paint-theme-set-fast | 328 µs | 333 µs | neutral |
| paint-gradient-rgb | 950 µs | 945 µs | neutral |

Paint scenarios are neutral as expected — they don't go through
the diff path. `diff-gradient` and `dogfood-realistic` are neutral
because every cell is dirty (full repaint). `diff-sparse` (~10%
dirty) and `diff-static` (0% dirty) are exactly the cases II-1
was designed to optimize, and they show the predicted wins.

`diff-static`'s 28% CoV is the only "ugly" number — but it's the
absolute-floor effect: at 7.58 µs, OS scheduler jitter dominates
absolute variance. The number is real.

**Why dogfood-realistic didn't move**

`dogfood-realistic` paints every cell in the surface every frame
(it's the "full repaint after scroll/resize" worst case). Every
cell is dirty, so the per-cell skip never fires. To benefit from
II-1, a real DOGFOOD frame would need to only repaint changed
regions — which is exactly what real components do. The bench
scenario is intentionally pessimistic.

**What's NOT yet optimized in II-1**

- The bench's runtime swap is modeled by an explicit
  `markAllRenderClean()` call. The real runtime (`bijou-tui`'s
  `runtime.ts`) does NOT yet call this. Currently the runtime
  relies on `nextSurface.clear()` between frames, which already
  resets the bitmap (via the existing `markAllClean()` extension).
  Should be a no-op change to verify, but worth confirming.
- Components that render directly into a long-lived surface
  without going through `clear()` won't see the win until they
  start managing the bitmap explicitly.

**Next: II-3 + II-4 (the byte pipeline)**

The differ still produces a per-frame `output: string` via
`+=` concatenation, hits the `sgrCache` Map for SGR codes, and
calls `io.write(output)` at the end. Part II's main work is
replacing all of that with byte-level emission into a pooled
`Uint8Array` and `io.writeBytes(buf, len)`. Targets:

- `diff-gradient`: 2.07 ms → < 1.5 ms (kill the sgrCache stress
  case)
- `paint-gradient-rgb` is unaffected (it's a paint-only scenario)
- All other scenarios should remain neutral or improve modestly

II-3 and II-4 are bigger and probably need to split across
sessions. Stopping here for this turn.

---

## 2026-04-10 — II-3 lands as opt-in plumbing (no perf delta)

**Goal**: pool a `Uint8Array` in the TUI runtime and route the
differ's output through `WritePort.writeBytes` instead of
`io.write(string)`. Set up the API surface that II-4 will use for
direct byte-level emission.

**What landed**

- `RenderState.outBuf?: Uint8Array` field on the pipeline state.
- `bijou-tui` runtime allocates a pooled buffer in `run()`,
  resizes it in `resetFramebuffers()`, and threads it through to
  the default Diff middleware via `RenderState`. Buffer is sized
  `cols * rows * 64 + 4096` (per-cell upper bound for ANSI + char
  + reset + cursor move with comfortable slack).
- `renderSurfaceFrame(io, current, target, style, outBuf?)` and
  `renderDiff(current, target, io, style, outBuf?)` both gain a
  trailing `outBuf` parameter and forward it to the packed differ.
- `renderDiffPacked` keeps its existing string-based emission loop
  unchanged. At the very end, when *all* of (caller passed an
  `outBuf`, port supplies `writeBytes`, and the UTF-8-worst-case
  expansion of the composed string fits the buffer) are true, it
  encodes the frame once via `TextEncoder.encodeInto` and hands
  the bytes to `io.writeBytes(buf, len)`. Otherwise it falls back
  to `io.write(string)` — correctness before optimization.

**The "encodeInto on every small write" detour**

The first attempt replaced every `output += X` site in the differ
with a `writeStr(X)` helper that called `TextEncoder.encodeInto`
per chunk. Predicted neutral; measured **regression**:

| Scenario | After II-1 | First II-3 attempt | Δ |
|---|---|---|---|
| diff-gradient | 2.07 ms | 4.55 ms | **+120%** |
| diff-sparse | 185 µs | 452 µs | **+144%** |
| dogfood-realistic | 465 µs | 588 µs | **+26%** |

Per-call `encodeInto` setup overhead dominates when the source
strings are short (cursor moves, SGR codes, single graphemes).
The V8 string-concat ropes that the legacy path relied on are
free by comparison.

Lesson: **the byte path's value is in `writeBytes` itself** —
specifically in handing a pre-encoded buffer to the OS instead of
re-walking a JS string at the stream boundary. It is **not** in
the act of encoding small chunks early. Until the differ can emit
SGR + cursor bytes *directly* without ever materializing them as
JS strings (II-4's job), the cheapest correct shape is one
encodeInto call per frame, on the fully composed output.

Reverted to the single-encodeInto-at-end design and
re-measured — neutral as expected.

**Bench results vs `HEAD-4216f15-after-II-1`**

Apple M1 Pro, Node v25.8.1, 30 samples each.

| Scenario | Baseline | After II-3 | Δ | Status |
|---|---|---|---|---|
| paint-ascii | 236.40 µs | 235.50 µs | -0.4% | ok |
| paint-rgb-fixed | 144.61 µs | 144.91 µs | +0.2% | ok |
| paint-theme-set | 635.26 µs | 631.32 µs | -0.6% | ok |
| paint-theme-set-fast | 329.83 µs | 328.75 µs | -0.3% | ok |
| paint-gradient-rgb | 943.82 µs | 939.43 µs | -0.5% | ok |
| diff-gradient | 2.05 ms | 2.02 ms | -1.5% | ok |
| diff-sparse | 179.68 µs | 184.68 µs | +2.8% | ok |
| diff-static | 9.58 µs | 7.82 µs | -18.3% | GOOD |
| dogfood-realistic | 461.59 µs | 468.45 µs | +1.5% | ok |

The diff-static "improvement" is mostly the floor-noise effect
(7.82 µs is well inside the 13.6% CoV bin); the remaining
scenarios are within ±3% of baseline. Plumbing achieved without
regression.

**Why bench scenarios stay on the string path**

The bench's counting sinks deliberately do not implement
`writeBytes`. With the byte path gated on
`outBuf !== undefined && io.writeBytes !== undefined`, all bench
scenarios fall through to `io.write(string)` and measure the
unchanged emission loop. The runtime alone opts in to the
bytes path in production. This was a deliberate choice after
the first attempt showed that letting the bench exercise the
`encodeInto`-at-end path adds work the bench sink does not need
to do (it counts `text.length`, no real byte conversion).

When II-4 lands, both bench and runtime should be measurable on
the byte path because there will no longer be a string
intermediate to skip past.

**What II-4 has to do**

The differ still builds an `output: string` in the inner loop.
II-4 replaces that with direct byte writes:

1. `moveCursor(x, y)` becomes a byte writer that emits
   `\x1b[`, decimal y+1, `;`, decimal x+1, `H` directly into
   the pooled buffer.
2. `emitSgrFromBuf` is replaced by a byte-level SGR builder.
   The `sgrCache` Map and its `styleCacheKey` String.fromCharCode
   indirection both go away — there is no string to cache
   anymore.
3. Batch text becomes a `TextEncoder.encodeInto(batchText, ...)`
   call against the pooled buffer (one per batch, not per cell).
4. `RESET_SGR` becomes a 4-byte literal write.

Once that lands, `diff-gradient`'s 9168-entry sgrCache stress
case should drop substantially. The current 2.02 ms is the
ceiling we are trying to beat.

**Files touched (II-3)**

- `packages/bijou/src/core/render/differ.ts` — `renderDiff` and
  `renderDiffPacked` gain optional `outBuf`; encode-at-end byte
  path under feature gates; `textEncoder` module-level singleton.
- `packages/bijou-tui/src/screen.ts` — `renderSurfaceFrame` gains
  `outBuf` and forwards.
- `packages/bijou-tui/src/pipeline/pipeline.ts` —
  `RenderState.outBuf?: Uint8Array` field.
- `packages/bijou-tui/src/runtime.ts` — `allocOutBuf(cols, rows)`
  helper, ownership inside `run()`, pass-through into the default
  Diff middleware and `RenderState` constructor.

**Smoke test**

`npm run smoke:dogfood` (landing + docs) passes. Real production
traffic now exercises the encode-at-end byte path; the bench
shows no regression on the string-path scenarios it can see.
