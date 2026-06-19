# WF-147 Respecting the Dojo Ratchet To 1319

## Status

Implemented.

## Tracker

- GitHub Issue: [#399](https://github.com/flyingrobots/bijou/issues/399)
- Pull Request: [#400](https://github.com/flyingrobots/bijou/pull/400)

## Intent

Continue the Respecting the Dojo burndown by removing at least 50 counted
standards violations from the landed `main` ceiling.

The current goalpost is not a release version. It is:

```text
Respectful Repo: Enter the Code Dojo
```

## Current Truth

Live counts on `main` at `c9370875`:

- aggregate Code Dojo debt: `1,369`
- ESLint findings: `960`
- file/context baseline: `332`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,319` or lower

Implemented counts on this branch before review:

- aggregate Code Dojo debt: `1,318`
- ESLint findings: `909`
- file/context baseline: `332`
- mock-ban baseline: `22`
- code-size baseline: `55`, including `4` legacy hard-limit files
- DOGFOOD raw-string debt: `2,766`
- next aggregate target: `1,268` or lower

Selected cleanup slice:

- `tests/cycles/LX-008/localized-shell-and-dogfood.test.ts`
- `tests/cycles/LX-005/bijou-i18n-tools-node.test.ts`
- `packages/bijou/src/core/theme/dtcg.fuzz.test.ts`
- `packages/bijou/src/core/binding-lifecycle.test.ts`

## Scope

- Select a focused cleanup slice from current ESLint or Code Dojo offenders.
- Prefer real type and control-flow fixes over local suppressions or baseline
  churn.
- Keep touched file/context, mock-ban, code-size, and DOGFOOD localization
  ratchets flat or lower.
- Update `scripts/code-dojo/baselines/eslint.json`, `package.json`,
  `docs/code-dojo-exceptions.md`, and `docs/CHANGELOG.md` after the live count
  is proven lower.

## Non-Goals

- No baseline increases.
- No release-version scope.
- No broad feature work.
- No rebase, amend, force push, or draft PR.

## Playback Questions

1. Is aggregate Code Dojo debt at `1,319` or lower?
2. Did the implementation remove at least `50` real counted violations?
3. Did touched file/context, mock-ban, code-size, and DOGFOOD localization
   ceilings stay flat or lower?
4. Did focused tests for touched behavior pass?

## Validation Plan

- Probe candidate files with `npm run code-dojo:eslint:offenders`.
- Run `npm run code-dojo:slice -- <touched TypeScript files>`.
- Run focused behavior tests for touched surfaces.
- Check aggregate debt with `npm run code-dojo:debt`.
- Confirm standards gates with `npm run code-dojo:verify`.
- Validate documentation inventory with `npm run docs:inventory`.
- Run `npm run lint` and `git diff --check`.

## Acceptance Criteria

- The selected touched files reduce live findings by at least `50`.
- Aggregate Code Dojo debt is `1,319` or lower.
- The ESLint baseline records the lower live count.
- The Code Dojo exception ledger and `package.json` report the lower ceiling.
