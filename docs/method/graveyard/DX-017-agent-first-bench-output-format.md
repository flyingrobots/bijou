---
title: DX-017 — Agent-First Bench Output Format
lane: graveyard
---

# DX-017 — Agent-First Bench Output Format

## Disposition

Shipped an additive flat bench output format. bench run now supports --format=json for nested bench.v2 output and --format=jsonl/--format=flat for one-metric-per-line records, compare auto-detects nested JSON vs flat JSONL, RunReport now carries a stable runId, and the bench docs describe the new structured output contract while preserving the existing human summary as the default console view.

## Original Proposal

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

The bench v2 report JSON is structured for humans: nested arrays,
scenario → samples → stats. It's readable but inefficient for
agents to consume programmatically, especially when comparing
many runs over time (e.g., "how did p99 trend across the last 20
RE-017 commits?").

Add a flat, agent-friendly output format alongside the existing
one. Structure:

```jsonl
{"runId":"...","scenario":"paint-gradient-rgb","commit":"abc","metric":"ns_per_frame.p50","value":946000,"unit":"ns","cov":0.029}
{"runId":"...","scenario":"paint-gradient-rgb","commit":"abc","metric":"ns_per_frame.p99","value":954000,"unit":"ns","cov":0.029}
{"runId":"...","scenario":"paint-gradient-rgb","commit":"abc","metric":"samples_count","value":30,"unit":"count"}
...
```

One line per (scenario, metric) tuple. Agents can stream, filter,
tail, or grep without parsing nested structures. Queries like
"give me the p50 for paint-gradient-rgb across runs X, Y, Z"
become one-line jq or ripgrep commands.

Expose via `bench run --format=jsonl` or `bench run --format=flat`,
with `--format=json` remaining the default for humans.

## Why

I (the agent) noticed this during the RE-017 audit when I had to
hand-build an aggregator (`scripts/aggregate-audit-runs.ts`, since
deleted) to crunch stats across 10 run files. If the output had
been flat JSONL I would have written `jq | sort | uniq` and been
done in a minute. Instead I wrote 200 lines of TypeScript that
had its own bugs.

More broadly: I operate more efficiently when tools emit data in
formats I can pipe through small composable UNIX primitives. The
human-friendly nested JSON is great for humans reading one run at
a time. It's not great for me reading 100 runs at a time.

This is an **agent-first observation**: a DX improvement that
benefits agents specifically. Humans can still use the nested
format. The flat format is an additional option that makes my
workflow faster and cleaner.

## Shape

- `bench/src/harnesses/wall-time/format-jsonl.ts` — converts a
  `RunReport` to a sequence of JSONL records.
- CLI: `bench run --format=jsonl` emits the JSONL instead of the
  nested JSON summary.
- `bench compare` accepts either format (auto-detect on the first
  line: `{"kind":"bench.v2"}` = nested, `{"runId":...}` = flat).
- Flat records include a stable `runId` (ULID or uuid) so records
  from the same run can be grouped.

## Prior Art

- Prometheus exposition format (label-keyed metrics, one per line).
- InfluxDB line protocol.
- OpenTelemetry traces-as-jsonl.

## Why This Is Cool

1. **Agent-ergonomic.** I can work with 100 bench runs using
   standard text tools. No custom aggregators.
2. **Streaming-friendly.** Large runs can stream to disk and be
   processed incrementally.
3. **Composes with tag filtering.** Pair with `DX-016-scenario-
   provenance-tags.md` for filtered cross-run analysis.
4. **Pairs with a future time-series view.** A dashboard or
   sparkline TUI can tail the JSONL and render live.

## Related

- `bench/src/harnesses/wall-time/runner.ts` — emits the current
  nested format.
- `DX-016-scenario-provenance-tags.md` — complementary filtering.
- Agent-first development philosophy: agents have their own DX
  needs; we advocate for them openly.
