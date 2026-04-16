# I-0d — Per-stage render pipeline instrumentation (buried 2026-04-09)

**Original scope:** add per-stage timing + allocation counters to
the render pipeline (Layout, Paint, Diff, Output), plus counters
for suspected hot int↔string conversions (parseHex, String.fromCharCode,
String.fromCodePoint, template-literal SGR, Map.get hits on sgrCache).
Gated behind an env var (`BIJOU_PERF=1`) so normal runs pay no
cost. The plan was to use this instrumentation to identify the
specific hot paths behind the broad RE-008 regression.

**Why buried:** task I-0e (investigate RE-008 broad slowdown)
completed its investigation without needing general pipeline
instrumentation. A targeted 3-scenario A/B/C bench comparison was
enough to prove the hypothesis empirically:

```
paint-rgb-fixed   145 µs  (11.4 ns/cell) — setRGB, no hex parsing
paint-ascii       231 µs  (18.1 ns/cell) — set({char}), no colors
paint-set-hex-palette   624 µs  (48.9 ns/cell) — set({char, fg, bg}) with hex
```

The delta between paint-set-hex-palette and paint-rgb-fixed is
**482 µs per frame of pure hex parsing overhead** — which is
77% of paint-set-hex-palette's total frame time. That was sufficient
to confirm the hypothesis (per-cell hex parsing in `inlineHexRGB`)
and point directly at the fix (pre-parse theme token colors at
theme load time, see `docs/method/backlog/cool-ideas/RE-019-theme-token-color-cache.md`).

General pipeline instrumentation would have been more work for
less signal than the targeted scenario comparison, and the
investigation is already closed.

**What lives on:** if a future perf issue can't be isolated with
targeted scenarios, pipeline instrumentation remains a valid
tool. Exhume this task then. The idea isn't wrong — it was
just unnecessary for this particular investigation.

**Cross-references:**

- `docs/perf/RE-017-byte-pipeline.md` — the RE-017 cycle log
  including the 2026-04-09 I-0e investigation result entry.
- `docs/method/backlog/bad-code/RE-018-hex-color-string-as-canonical-fg-bg.md`
  — the root-cause smell the investigation confirmed.
- `docs/method/backlog/cool-ideas/RE-019-theme-token-color-cache.md`
  — the fix direction.
