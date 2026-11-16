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

DOGFOOD shows Code Dojo debt on one guide, **Code Dojo debt**, on the existing
`release` page. The guide renders two committed JSON files and computes
nothing at render time:

- `docs/code-dojo/debt-report.json` is the current snapshot. The command
  `npm run code-dojo:report` writes it and `npm run code-dojo:debt` checks it
  for drift.
- `docs/code-dojo/debt-history.json` is an append-only ledger with one row for
  each PR that changed the count. The same command appends rows to it. DOGFOOD
  never walks git.

Two panels ship first (#604): **aggregate and next target**, then **debt by
source** with top ESLint rules. The **live and stored ceiling** row appears only
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
2. **The debt is zero.** Issue #527 cleared the last twelve file/context
   entries, and commit `f4a36c54` set the ceiling in
   `"code-dojo:debt": "tsx scripts/code-dojo-debt.ts --max 0"`. Every source
   count is `0` and `nextGoalpostTarget` is `0`. The dashboard's first job is to
   show that the count holds at zero and to make any regression obvious. A
   burndown frontier comes second.
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

- One generated file is committed, and the existing fast gate checks it. A
  stale report fails `code-dojo:debt`, which reads only JSON and adds no
  ESLint cost.
- A PR that changes a baseline must also run `npm run code-dojo:report`. The
  drift failure tells the author to do this.
- Live data appears only when a person runs the command with `--live`. The
  committed report records `"live": null`, and the page then shows no live
  row. This is not a failure.
- The dashboard stays outside the release gate. No workflow requires it to
  render.
- This decision is reversible. A later DL record can replace the ledger with
  another source, provided it keeps the `code-dojo.debt-history.v1` reader.

## Contracts for Dependent Tasks

### #603: report command

- **Module:** `scripts/code-dojo-debt-report.ts`. It exports a pure function,
  `buildCodeDojoDebtReport(input): CodeDojoDebtReport`, that calls
  `summarizeCodeDojoDebt()` to compute the counts. Counts therefore cannot
  drift from the text aggregate.
- **Command:** `"code-dojo:report": "tsx scripts/code-dojo-debt-report.ts"`.
  - With no flags, it writes `docs/code-dojo/debt-report.json`.
  - `--check` exits `1` with a drift message if the file is stale. Append
    `node --import tsx scripts/code-dojo-debt-report.ts --check` to
    `code-dojo:debt`.
  - `--live --out <path>` also runs ESLint and fills `live`. Never commit its
    output to the default path.
  - `--record --pr <n> --title <text>` appends one row to
    `docs/code-dojo/debt-history.json` when the total differs from the last
    row.
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
  "eslintRules": [{ "ruleId": "string", "count": 0 }],
  "live": null
}
```

  `ceiling` comes from the `--max` value in the `code-dojo:debt` script.
  `eslintRules` is the baseline `rules` array, sorted by count descending and
  then by `ruleId`, with at most 10 entries. When `live` is present, it is
  `{ "eslintViolations": n, "eslintFiles": [{ "path": "...", "count": n }] }`,
  with at most 10 files. This is the #369 live-versus-stored comparison.
  Sources keep this fixed order.
- **Tests:** `scripts/code-dojo-debt-report.test.ts` builds a report from a
  fixture directory and checks a golden JSON. It also asserts that
  `totalViolations` equals `loadCodeDojoDebtSummary().totalViolations`, that
  `live` is `null` without `--live`, and that `--check` detects a stale file.

### #604: snapshot guide

- **Location:** a new `examples/docs/app-guides-code-dojo.ts` that exports a
  `GuideDoc` with `pageId: RELEASE_PAGE_ID`, appended to
  `RELEASE_AND_THEME_GUIDES`. Add a guide id constant to `app-ids.ts`.
- **Data:** read the report JSON through a small validating reader,
  `examples/docs/app-code-dojo-report.ts`. If the schema is invalid or the file
  is missing, render an empty-state message and do not throw.
- **Panels, in order:**
  1. Aggregate and next target: total, ceiling, next target, and a status line.
     At `0`, the status line says the count is clear and held at the ceiling.
  2. Debt by source: four rows in contract order, with `overHardLimit` beside
     code size.
  3. Top ESLint rules, with an empty state at zero.
  4. Live and stored ceiling, only when `live` is not `null`.
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
    { "pr": 527, "title": "string", "before": 12, "after": 0, "goalpost": "string or null" }
  ]
}
```

  `goalpost` names the goalpost that the row closes. A goalpost counts as met
  when `before - after` summed over its rows reaches at least 50, or when the
  count reaches zero.
- **Backfill:** seed the ledger once from the tranches recorded in
  `docs/code-dojo-exceptions.md` (`112 -> 62 -> ... -> 0`). Each row cites the
  PR or commit named there. Leave a field `null` where the ledger names no PR.
  Do not invent one.
- **Panels:** recent PR deltas (the last 10 rows, newest first, with signed
  deltas) and goalpost history (each goalpost with its total reduction and a
  met or unmet state). Add both to the #604 guide after the snapshot panels.
- **Tests:** a golden render from a fixture ledger, an empty ledger, and a
  test that the page code never spawns `git`.

## Out of Scope

- Any implementation in this record.
- Making the dashboard a release gate.
- Fixing #369's live-versus-stored reporting itself. #603 only carries the
  data that #369 produces.
