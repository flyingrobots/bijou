# WF-132 - Release Readiness And DOGFOOD I18n Gates

## Status

In progress for issues
[#270](https://github.com/flyingrobots/bijou/issues/270) and
[#312](https://github.com/flyingrobots/bijou/issues/312).

## Linked Legend

- `legend:wf` for release workflow readiness.
- `legend:df` for DOGFOOD docs-surface coverage.
- `legend:lx` for localization debt and scanner behavior.

## Sponsors

- Human sponsor: James Ross.
- Agent sponsor: Codex.

## Hill

Before `v7.1.0` is cut, release readiness should be inspectable as a
milestone-specific report and DOGFOOD i18n debt should cover newly added docs
modules by default.

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

## Playback Questions

- Does `release:readiness -- --milestone v7.1.0` explain why a release is or is
  not ready before running expensive local gates?
- Can a new `examples/docs/**/*.ts` module introduce visible copy without
  increasing the DOGFOOD i18n debt ratchet?
- Are remaining release-process gaps documented instead of silently implied?

## Accessibility / Assistive Posture

No runtime UI accessibility behavior changes. The new readiness report is plain
text plus a Markdown table so it can be copied into release PRs and read by
terminal or screen-reader workflows.

## Localization / Directionality Posture

#312 directly strengthens localization guardrails. It does not localize
existing raw DOGFOOD copy; it makes the current raw-string debt baseline honest
across newly discovered DOGFOOD modules.

## Agent Inspectability / Explainability Posture

The release-readiness report classifies each gate as pass/fail with a concise
summary. The i18n debt scanner continues to report counts by source surface so
agents can identify which DOGFOOD module moved the ratchet.

## Linked Invariants

- Release tags require issue-complete tracker posture and release evidence.
- DOGFOOD visible strings must either be cataloged, counted as known debt, or
  explicitly excluded as non-product tooling.
- The no-argument local `release:readiness` gauntlet must keep working without
  GitHub access.

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

## Tests To Write First

- Release-readiness report classification for ready milestone fixture data.
- Release-readiness report failures for open tracker issues, WIP labels, stale
  release docs, and missing release packet evidence.
- CLI parsing for `--milestone`.
- DOGFOOD i18n source discovery for new docs modules and documented exclusions.
- DOGFOOD i18n ratchet failure when a newly discovered module adds raw visible
  text above a supplied zero baseline.

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

## Retrospective

To be completed when the PR lands.
