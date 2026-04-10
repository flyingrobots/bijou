# I-3 — Custom baseline JSON format + compare tool (buried 2026-04-09)

**Original scope:** define a new JSON schema for renderer bench
reports, add a `compare` CLI that diffs two reports, and wire up
baseline-saving workflow.

**Why buried:** the RE-017 audit scrapped the entire old
`scripts/renderer-bench*.ts` harness and rebuilt the bench from
scratch as the `bench/` top-level workspace package. bench v2
(commit `4b563cf`) ships with:

- Its own report schema (`bench.v2` kind, `bench/src/harnesses/wall-time/runner.ts`).
- Its own comparison tool (`bench/src/harnesses/wall-time/compare.ts`).
- Its own baseline saving via `bench run --out` and
  `npm run bench:baseline`.

Everything this task was going to build already exists in the new
package. There is no standalone "baseline format" to design
anymore — the format is the `RunReport` type in `runner.ts` and
the compare is `compareReports` in `compare.ts`.

**What lives on:** if we later decide we want a cross-cycle
historical baseline archive (e.g., one commit-tagged JSON per
merge to main), that is a separate future concern handled by
`bench/baselines/` conventions, not by reviving this task.

**Cross-references:**

- `bench/README.md` — current bench design and usage.
- `docs/perf/RE-017-byte-pipeline.md` — the RE-017 cycle where
  this was deleted.
- Commit `4b563cf` — bench v2 initial build.
