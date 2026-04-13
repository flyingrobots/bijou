# @flyingrobots/bijou-bench

Performance benchmarks for bijou. Designed around three harnesses
that share the same scenario definitions:

1. **Wall-time harness** (`src/harnesses/wall-time/`) — process-isolated
   frame-time measurement. One child process per sample. Zero cross-
   sample state bleed. The core "how fast is this?" bench.
2. **Memory harness** (`src/harnesses/memory/`) — stub for now. Will
   use v8 heap snapshots / profilers to measure allocation rate per
   scenario without polluting the frame-time measurement.
3. **Interactive sandbox** (`src/harnesses/sandbox/`) — stub for now.
   Will render scenarios live in a TUI with a metrics overlay so
   humans can watch them run.

## Design principles

- **Measure what you can trust.** The main bench only captures wall
  time via `process.hrtime.bigint()`. No heap delta arithmetic, no
  bimodal GC measurements, no inline observers that may or may not
  see events. When in doubt, don't measure it.
- **Isolate samples.** One child process per sample. Fresh V8 isolate
  every time. The scenario's own `warmupFrames` stabilizes the JIT
  inside the child before timing starts.
- **Scenarios are pure.** A scenario exports `setup()`, `frame()`,
  and metadata. It does not know how it's being measured. The same
  scenario can be run by the wall-time harness, the memory harness,
  or the sandbox harness without modification.
- **Report stats, not means.** A single scenario's samples produce
  mean, stddev, CoV, min, max, p50, p90, p99. CoV < 5% is the
  "trust this" signal.

## Usage

From the repo root:

```bash
# List available scenarios
npm run bench -- list

# Run all scenarios, default samples + frames
npm run bench

# Run one scenario
npm run bench -- run --scenario=paint-gradient-rgb

# Run the fixed CI gradient lane locally
npm run -s bench:ci:gradient

# Custom sample count and override frame counts
npm run bench -- run --samples=50 --warmup=30 --frames=200

# Save a baseline
npm run bench:baseline

# Compare two runs
npm run bench:compare baseline.json current.json
```

## Scenario catalog

See `src/scenarios/` for the current registry. Each scenario module
contains a description explaining what it stresses.

## Adding a scenario

1. Create `src/scenarios/<id>.ts`.
2. Export a `Scenario<State>` with a unique `id`, a `label`, a
   descriptive `description` (what code path does it exercise?),
   terminal dimensions, and `setup()` / `frame()` implementations.
3. Add the import + registration to `src/scenarios/index.ts`.
4. The scenario is now available to every harness.

## Why not use the old `scripts/renderer-bench*.ts`?

The old bench was scrapped during the RE-017 audit (2026-04-09).
Its heap delta measurement was bimodal by construction (GC could
fire during the sample loop, collecting allocations before the
post-loop snapshot), and an attempt to fix it with a
`PerformanceObserver('gc')` listener produced garbage data (zero
GC events reported even for samples that clearly allocated
tens of MiB). Rather than keep patching a brittle measurement,
we rebuilt the bench around the principle that measurements you
can't trust are worse than no measurement at all.

See `docs/perf/RE-017-byte-pipeline.md` for the full context.

## GC observer repro

If you need to investigate the old `PerformanceObserver('gc')` question in
isolation, use the dedicated repro instead of rebuilding the measurement logic
inside a real bench harness:

```bash
npm run bench:gc-observer-repro
```

This command intentionally runs outside the main wall-time harness with
`--expose-gc` so you can compare `heapUsed` deltas against observer-reported GC
events without polluting production scenarios. It is a diagnostic tool only,
not a release gate and not part of the trusted wall-time bench story.

## CI gradient lane

The repo now runs a dedicated gradient benchmark lane in CI using the
wall-time harness, not heap deltas or `PerformanceObserver('gc')`.

It is an informational reporting lane, not a hard regression gate. The harness
is trusted; the workflow publishes the numbers and JSON artifact so future gate
work can be built on real CI data instead of guessed thresholds.

- Scenario set: `paint-gradient-rgb`, `diff-gradient`
- Samples: `30`
- Output: JSON artifact plus a markdown step summary on the workflow run

Use the same lane locally when you want to reproduce the CI benchmark surface:

```bash
npm run -s bench:ci:gradient -- --out /tmp/bijou-gradient-ci.json
```
