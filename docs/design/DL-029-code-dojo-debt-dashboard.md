---
title: DL-029 Code Dojo Debt Dashboard
lane: cool-ideas
priority: medium
github_issue: 601
status: accepted
keywords:
  - code-dojo
  - dogfood
  - standards
  - debt
  - v8.2.0
---

# Code Dojo Debt Dashboard

## Linked Work

- Decision: [#601](https://github.com/flyingrobots/bijou/issues/601)
- Container: [#371](https://github.com/flyingrobots/bijou/issues/371)
- Report command: [#603](https://github.com/flyingrobots/bijou/issues/603)
- Snapshot page: [#604](https://github.com/flyingrobots/bijou/issues/604)
- History panel: [#606](https://github.com/flyingrobots/bijou/issues/606)
- Live and stored ceilings: [#369](https://github.com/flyingrobots/bijou/issues/369)
- Policy ledger: [`docs/code-dojo-exceptions.md`](../code-dojo-exceptions.md)

## Decision Summary

This record specifies proposed behavior for #603, #604 and #606. The report
command, JSON files and guide do not exist yet. Context describes existing
behavior; this PR implements none of the proposal.

DOGFOOD will show Code Dojo debt on one guide, **Code Dojo debt**, on the existing
`release` page. The guide renders two committed JSON files and computes
nothing at render time:

- `docs/code-dojo/debt-report.json` is the current snapshot. The command
  `npm run code-dojo:report` writes it; explicit report `--check` detects drift.
  Normal debt commands, hooks and CI remain unchanged.
- `docs/code-dojo/debt-history.json` is an append-only ledger with one row for
  each recorded PR or goalpost event, including zero-debt goalposts. Explicit
  recording appends rows idempotently. DOGFOOD
  never walks git.

Two panels ship first (#604): **aggregate and next target**, then **debt by
source** with top ESLint rules and files. The **live and stored ESLint** row appears only
when a report carries live data. **PR deltas** and **goalpost history** ship
second (#606) from the ledger.

## Context

The cost model in the code differs from the one #371 assumed.

1. **The stored aggregate is cheap.** `loadCodeDojoDebtSummary()` in
   `scripts/code-dojo-debt.ts` reads three baseline files in
   `scripts/code-dojo/baselines/` and the `CODE_SIZE_BASELINE` constant. It
   already has a `--json` mode, which emits the `CodeDojoDebtSummary` fields.
   Only live measurement is expensive: a full ESLint run
   (`scripts/code-dojo/eslint-offenders.mjs`, `eslint-results.mjs`) and git
   history walks.
2. **The stored baseline aggregate is zero.** Issue #527 cleared the last twelve file/context
   entries, and commit `f4a36c54` set the ceiling in
   `"code-dojo:debt": "tsx scripts/code-dojo-debt.ts --max 0"`. Every source
   count is `0` and `nextGoalpostTarget` is `0`. The dashboard's first job is to
   show that the count holds at zero and to make any regression obvious. A
   burndown frontier comes second. These are baseline units, not unique files
   or a live scan: file/context and code-size count entries, mock-ban counts
   recorded violations, and ESLint counts diagnostic occurrences. A file can
   contribute to multiple sources. Hard-limit entries are a code-size subset,
   never added to the aggregate again.
3. **The history exists only as prose.** The goalpost tranches
   (`112 -> 62 -> 52 -> 42 -> 32 -> 22 -> 12 -> 0`) are recorded in the
   ledger's prose and in commit messages such as `825a2fb8` and `2381b236`.
   Nothing stores them in a machine-readable form.
4. **DOGFOOD has a guide catalog.** `examples/docs/app-guide-catalog.ts`
   composes `GuideDoc` lists for each `DocsPageId`. The `release` page
   (`app-guides-release.ts`) already holds release-posture guides. A new
   `DocsPageId` would change routes, the settings menu, and mouse routes for a
   single view.

## Options Considered

| Option | Data source | Strength | Rejected cost |
| --- | --- | --- | --- |
| **A. Committed report and ledger** | `docs/code-dojo/*.json`, written by `code-dojo:report` | deterministic; works in recordings and fixtures; no scripts import in DOGFOOD; history without git | selected |
| B. Live computation in DOGFOOD | DOGFOOD imports `loadCodeDojoDebtSummary()` and runs ESLint and git at startup | always current | breaks the #371 rule against expensive live reports; ties `examples/docs` to `scripts/`; nondeterministic captures |
| C. Stored summary at startup, git log for history | baselines read at startup; `git log -- scripts/code-dojo/baselines` for deltas | no new committed files | git walks in normal runs are a known failure mode in #606; DOGFOOD fails outside a checkout; baseline commits do not map 1:1 to PRs |
| D. CI artifact or HTML page outside DOGFOOD | workflow upload | no DOGFOOD work | does not meet #371's outcome of a DOGFOOD surface; invisible to agents reading the repo |

### Why the rejected options lost

- **B** puts the expensive path on every launch. That is the cost #371 rules out
  of scope ("slowing normal CI with expensive live reports"). It also makes
  smoke captures and VHS tapes depend on the state of the working tree.
- **C** is cheap for the snapshot, but its history depends on git. The commit
  graph does not record PR numbers or goalpost boundaries reliably, and a
  shallow CI clone has no history to read. The ledger in option A records both
  explicitly.
- **D** solves visibility for CI readers only. The container asks for an
  inspectable product surface.

## Consequences

- The snapshot is refreshed explicitly. Opt-in `code-dojo:report --check`
  detects drift; no check is appended to normal debt, hook or CI commands.
  The page labels the data a stored snapshot, not a live guarantee.
- Live data is optional input from #369. The committed report has `"live": null`;
  files and live comparisons then show unavailable, not invented zero counts.
- The dashboard stays outside the release gate. No workflow requires it to
  render.
- This decision is reversible. A later DL record can replace the ledger with
  another source, provided it keeps the `code-dojo.debt-history.v1` reader.

## Contracts for Dependent Tasks

### #603: report command

- **Module:** `scripts/code-dojo-debt-report.ts`. It exports a pure function,
  `buildCodeDojoDebtReport(input): CodeDojoDebtReport`, that calls
  `summarizeCodeDojoDebt()` to compute the counts. Shared calculation and parity
  tests guard against drift from the text aggregate.
- **Command:** `"code-dojo:report": "tsx scripts/code-dojo-debt-report.ts"`.
  - With no flags, it writes `docs/code-dojo/debt-report.json`.
  - `--check` exits `1` with a drift message if the selected file is stale.
    This operation remains optional; normal debt, hooks and CI are unchanged.
  - `--live-input <path> --out <path>` validates a #369 artifact and fills
    `live`. It does not implement #369 or implicitly scan. Until that source
    exists, live data is unavailable. Reject the default committed output path.
  - `--record <event.json>` validates and appends a #606 history event,
    including explicit zero-change goalpost events.
- **Report shape** (`docs/code-dojo/debt-report.json`). Do not include
  timestamps, so that output is byte-stable for `--check`:

```json
{
  "schema": "code-dojo.debt-report.v1",
  "totalViolations": 0,
  "ceiling": 0,
  "goalpostReduction": 50,
  "nextGoalpostTarget": 0,
  "sources": [
    { "id": "file-context", "count": 0 },
    { "id": "mock-ban", "count": 0 },
    { "id": "code-size", "count": 0, "overHardLimit": 0 },
    { "id": "eslint", "count": 0 }
  ],
  "eslintRules": [],
  "live": null
}
```

  `ceiling` comes from the `--max` value in the `code-dojo:debt` script.
  `eslintRules` is the baseline `rules` array, sorted by count descending and
  then by `ruleId`, with at most 10 entries. When `live` is present, it is
  `{ "eslintViolations": n, "eslintFiles": [{ "path": "...", "count": n }] }`,
  with at most 10 files sorted by count descending then path. Missing file
  data is `null`, distinct from a measured empty array. Counts are non-negative
  integers. Compare live ESLint occurrences only with the stored ESLint source
  count: signed slack is stored minus live; negative slack signals regression.
  The aggregate ceiling is a different, mixed-source quantity. Do not call an
  ESLint-only measurement live aggregate debt.
  Sources keep this fixed order.
- **Tests:** `scripts/code-dojo-debt-report.test.ts` builds a report from a
  fixture directory and checks a golden JSON. It also asserts that
  `totalViolations` equals `loadCodeDojoDebtSummary().totalViolations`, that
  `live` is `null` without live input, and that `--check` detects a stale file.
  Cover same-unit comparison and unavailable versus measured zero.

### #604: snapshot guide

- **Location:** a new `examples/docs/app-guides-code-dojo.ts` that exports a
  `GuideDoc` with `pageId: RELEASE_PAGE_ID`, appended to
  `RELEASE_AND_THEME_GUIDES`. Add a guide id constant to `app-ids.ts`.
- **Data:** read the report JSON through a small validating reader,
  `examples/docs/app-code-dojo-report.ts`. If the schema is invalid or the file
  is missing, render an empty-state message and do not throw. A proposed
  `BIJOU_CODE_DOJO_REPORT` path selects an explicitly generated local report;
  otherwise use the committed snapshot. This connects `--live-input --out`
  to the guide without scanning during rendering.
- **Panels, in order:**
  1. Aggregate and next target: total, ceiling, next target, and a status line.
     At `0`, the status line says the count is clear and held at the ceiling.
  2. Debt by source: four rows in contract order, with `overHardLimit` beside
     code size.
  3. Top ESLint rules from the baseline and files from the selected live
     artifact. Files show unavailable without data, distinct from measured empty.
  4. Live versus stored ESLint occurrences and signed slack when available.
- **Components:** use existing Bijou stats and table families. Each panel must
  lower to `static`, `pipe`, and `accessible` output without colour-only
  meaning.
- **Copy:** route all visible copy through `dogfoodText()`, to satisfy the
  DOGFOOD localization touched-file rule.
- **Tests:** snapshot fixtures in `examples/docs/fixtures/` for a zero report,
  a non-zero report with live data, and a missing report, in all four output
  modes and at a narrow width.

### #606: PR deltas and goalpost history

- **Ledger shape** (`docs/code-dojo/debt-history.json`):

```json
{
  "schema": "code-dojo.debt-history.v1",
  "entries": [
    {
      "eventId": "stable-source-event-id",
      "kind": "goalpost",
      "pr": null,
      "commit": null,
      "citation": "verifiable-source-reference",
      "title": "string",
      "before": 0,
      "after": 0,
      "goalpostId": "stable-goalpost-id",
      "closesGoalpost": true
    }
  ]
}
```

  Kinds are `pr`, `tranche`, or `goalpost`. Counts and source identifiers may
  be `null` when evidence is missing; never infer a numeric delta from an
  unknown count. Require a citation supporting each count and attribution.
  A PR or commit identity alone does not establish its debt count. All related
  tranches carry the same `goalpostId`, not only the closing row; unsupported
  attribution remains `null`.
- **Recording:** `--record <event.json>` requires a stable unique `eventId`.
  An identical repeat is a no-op; a conflicting repeat fails without changing
  the ledger. Record explicit zero-to-zero goalpost events. Never infer the
  first event's `before` from an absent previous row. Known discontinuities
  invalidate a claimed continuous series; missing evidence remains unknown.
- **Accounting:** use evidenced goalpost start and closing counts, counting
  each tranche once without overlapping PR/tranche double counts. Required
  reduction is `min(50, start)`. Starting at zero requires holding zero. A
  tranche does not reset the starting denominator. Gaps, missing boundaries,
  unsupported attribution or ambiguous overlaps yield `unknown`, not met.
- **Backfill:** use evidenced tranches in `docs/code-dojo-exceptions.md`, citing
  actual PRs, commits or prose sections. Retain unknown fields rather than
  fabricating a complete chain. Label partial backfill as partial history.
- **Panels:** recent PR deltas show the last ten PR events, with known signed
  changes or an explicit unknown value. Goalposts show evidenced reduction and
  met, unmet or unknown states, including zero-debt events. Add both after the
  snapshot panels.
- **Tests:** golden, empty and partial ledgers; repeat/conflicting IDs; zero-debt
  goalposts; unattributed tranches; gap/overlap handling; no `git` spawning.

## Out of Scope

- Any implementation in this record.
- Making the dashboard a release gate.
- Fixing #369's live-versus-stored reporting itself. #603 only carries the
  data that #369 produces.
