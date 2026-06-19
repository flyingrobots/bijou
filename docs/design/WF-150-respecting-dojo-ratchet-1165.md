# WF-150 Respecting the Dojo Ratchet To 1165

## Status

Shaping.

## Tracker

- Issue: [#405](https://github.com/flyingrobots/bijou/issues/405)
- Pull request: [#406](https://github.com/flyingrobots/bijou/pull/406)

## Context

Respectful Repo: Enter the Code Dojo remains the active goalpost before the
next `v7.2.0` product pull. WF-149 landed at `321bb2b0` with aggregate Code
Dojo debt at `1,215`.

Live counts on `main` at `321bb2b0`:

- aggregate Code Dojo debt: `1,215`
- ESLint findings: `807`
- file/context baseline: `331`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,165` or lower

## Scope

- Select a focused cleanup slice from current ESLint or Code Dojo offenders.
- Remove at least `50` counted violations with real fixes.
- Keep touched files under existing file/context and code-size ceilings.
- Ratchet stale baseline entries down or out when touched files fall below
  thresholds.
- Update the Code Dojo exception ledger, ESLint baseline, package ceiling, and
  changelog with the landed count.

## Non-Goals

- Do not raise baselines.
- Do not change public runtime semantics merely to satisfy lint.
- Do not return to `v7.2.0` product work in this cycle.
- Do not treat exceptions as adherence.

## Validation

- `npm run code-dojo:slice -- <touched files>`
- focused tests covering touched behavior
- `npm run code-dojo:debt`
- `npm run code-dojo:verify`
- `npm run docs:inventory`
- `npm run lint`
- `git diff --check`
- full pre-push gate before merge

## Acceptance

- Aggregate debt is `1,165` or lower.
- ESLint baseline is lowered by at least `50` unless other real Dojo debt is
  removed in the same cycle.
- No file/context, mock-ban, or code-size baseline increases are introduced.
- GitHub PR checks are green with zero unresolved review threads before merge.
