# WF-132 - Release Readiness And DOGFOOD I18n Gates

## Status

In progress for issues
[#270](https://github.com/flyingrobots/bijou/issues/270) and
[#312](https://github.com/flyingrobots/bijou/issues/312).

## Problem

The repo already has `npm run release:readiness`, but the command is mostly a
validation gauntlet. It does not produce a milestone-aware readiness report
that proves tracker closure, WIP-label cleanup, release-document posture, and
package smoke coverage before a release tag.

The DOGFOOD i18n debt ratchet also depends on a hand-maintained source list.
New `examples/docs/**/*.ts` modules can introduce visible strings without
participating in the debt baseline.

## Scope

- Keep `release:readiness` as the single release readiness command.
- Add an optional milestone report mode that can be run before tagging, for
  example `npm run release:readiness -- --milestone v7.1.0`.
- Classify tracker, docs, release-packet, and package-smoke readiness using
  deterministic fixture-testable data.
- Discover DOGFOOD TypeScript debt sources from `examples/docs/**/*.ts` by
  default, with documented exclusions for tooling-only files.
- Preserve per-surface i18n debt counts so ratchet output stays actionable.

## Non-Goals

- Do not move broad V8/V9 product work into `v7.1.0`.
- Do not require GitHub access for the default no-argument local gauntlet.
- Do not replace the GitHub release dry-run workflow; the local report should
  point to the existing workflow boundary.
- Do not burn down the current DOGFOOD raw-string debt in this cycle.

## Implementation Plan

1. Extend `scripts/release-readiness.ts` with a milestone-aware readiness
   report model and CLI parsing for `--milestone`.
2. Keep the existing command plan intact, but add package-smoke proof by
   recognizing the existing `smoke:canaries` package-pack canary step and the
   release dry-run workflow boundary.
3. Add fixture tests for ready, open-issue, lingering-WIP, stale-docs, and
   missing-release-packet report classification.
4. Replace the hand-maintained `DOGFOOD_I18N_DEBT_SOURCES` list with
   deterministic source discovery under `examples/docs/`.
5. Add tests proving newly added docs modules are discovered and can fail the
   ratchet when they add raw visible strings.
6. Update release/DOGFOOD docs, roadmap posture, and changelog entries.

## Acceptance

- `npm run release:readiness` keeps running the current gauntlet.
- `npm run release:readiness -- --milestone v7.1.0` prints a concise readiness
  report before running the gauntlet and blocks if milestone readiness is not
  satisfied.
- Report classification is covered by unit tests with fixture tracker data.
- `dogfood:i18n:debt` covers new `examples/docs/**/*.ts` modules unless the
  module is explicitly excluded as tooling-only.
- The current DOGFOOD i18n baseline reflects the newly covered sources and
  still reports counts by source surface.
