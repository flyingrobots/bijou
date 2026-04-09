# DX-008 — `PerformanceObserver('gc')` Is Unreliable For Our Measurement Needs

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Problem

During the RE-017 audit (2026-04-09), I tried to use
`PerformanceObserver({ entryTypes: ['gc'] })` in the renderer bench
to filter out samples where V8 GC fired during the timed loop. The
idea was to set up the observer, run the sync measurement loop,
call `observer.takeRecords()` afterwards, and count any captured
GC events as "sample was affected, discard the heap delta."

The result: **zero GC events reported across 1,000 samples**,
even for scenarios that clearly allocated 50+ MiB per sample and
must have triggered multiple young-gen collections. Yet the
`heapUsedAfter - heapUsedBefore` delta for those same samples was
frequently negative (heap shrank by 90+ MiB), which is only
possible if GC ran.

The observer silently failed to report events that the heap
delta clearly said happened.

## Reproducer

See the git history of `scripts/renderer-bench.ts` around the
RE-017 audit (the file is scheduled for deletion; the fix attempt
used `observer.observe({ entryTypes: ['gc'] })` with either a
no-op callback + `takeRecords()` or with a collecting callback
via the `list.getEntries()` form). Environment: macOS 25.3 on
Apple M1 Pro, Node v25.8.1, `node --expose-gc`.

## Why This Matters

GC-event observability is the standard recommendation for
distinguishing "this sample's heap delta is meaningful" from
"this sample's heap delta is polluted by GC". If the API doesn't
work reliably, we either:

1. Can't filter samples → heap metrics are bimodal and
   uninterpretable.
2. Have to use an alternative mechanism: heap snapshots
   (expensive), `v8.getHeapStatistics()` deltas over longer
   windows, `--trace-gc` parsing, or not measuring heap at all.

For RE-017 we chose option 4: the new bench v2 under `bench/`
does not measure heap at all. Wall time only. Memory analysis
is a separate, deliberate exercise with its own tool.

## What Needs To Happen

1. **Reproduce in isolation.** Build a minimal repro: an
   observer, a loop that allocates 10 MiB, a call to
   `takeRecords()`. Confirm the observer sees GC events when it
   should.
2. **If the repro also fails:** file a Node.js bug.
3. **If the repro works:** figure out what was different in the
   RE-017 bench use case. Possible causes: observer observing
   before V8 starts emitting events, the "no-op callback" pattern
   interfering with buffering, an interaction with `tsx` or
   `--import`, or `global.gc(true)` somehow clearing the buffer.
4. **Document the working pattern in `bench/README.md`** so
   future harnesses can use it correctly.

Until one of the above is done: **do not use
`PerformanceObserver('gc')` as a measurement filter in bijou
benches**. Treat the observer as diagnostic-only, not load-bearing.

## Related

- `docs/perf/RE-017-byte-pipeline.md` has the full log entry
  describing the failed measurement, the bimodal data it
  produced, and the decision to scrap the old bench entirely.
- `bench/README.md` explains the "measure what you can trust"
  principle that came out of this.
