# WF-009 - Keep Release PRs Under Automated Review File Limits

Legend: [WF - Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor human

A maintainer preparing release-boundary work that may span many packages,
docs, examples, tests, and backlog notes.

## Sponsor agent

An agent executing the METHOD loop through pull, implementation, commit,
push, PR, and merge without producing a PR too large for automated review.

## Hill

Release-boundary work is sliced into reviewer-sized PRs before the final
release sync, so automated review, CI, and human inspection all see bounded
changes.

## Why this cycle exists

CodeRabbit skipped PR #65 because the diff exceeded its 150-file cap. PR #69
also reached the danger zone: the local pre-push hook warned about 23 commits,
and CodeRabbit selected 149 files for processing.

The issue is not that large releases are bad. The issue is that a large
release must be composed from smaller reviewable precursor PRs instead of
arriving as one oversized branch.

## Playback questions

1. Can an operator identify when a release branch must be split before PR?
2. Can an agent choose the next release-boundary slice without relying on chat
   memory?
3. Can a reviewer see whether a PR is intentionally a precursor slice or a
   final release sync?
4. Can the final release PR stay mostly about version, changelog, long-form
   release docs, and release validation rather than hiding unrelated features?

## Accessibility / assistive reading posture

This is workflow documentation. It must remain useful in plain markdown,
terminal readers, MCP document summaries, and copied text. The policy uses
short numbered rules instead of relying on diagrams.

## Localization / directionality posture

No localized runtime behavior changes. The guidance should avoid idioms that
make the release process harder to translate later.

## Agent inspectability / explainability posture

The slicing threshold and required response live in repo docs, not chat memory:

- [docs/WORKFLOW.md](../WORKFLOW.md)
- [docs/release.md](../release.md)
- this cycle doc

## Non-goals

- changing branch protection
- disabling CodeRabbit
- forcing every tiny fix into its own PR
- tagging or publishing `v6.0.0`

## Decision

Bijou release work should use precursor PRs whenever a branch is likely to
exceed automated review limits.

The practical thresholds are:

- hard stop: more than 140 changed files before opening a PR
- caution: more than 10 commits on one branch
- caution: unrelated legends or cycle families mixed in one branch
- caution: generated snapshots or docs mixed with unrelated runtime changes

When a threshold is hit, split by cycle or product surface:

- runtime engine
- TUI shell and interaction
- core components
- DOGFOOD and docs proof
- backlog/release-lane bookkeeping
- release version/changelog/tag prep

The final release PR should be boring. It should primarily contain version
bump, changelog, release docs, release-readiness proof, and any final metadata
adjustments that cannot land earlier.

## Implementation outline

1. Add PR sizing discipline to the short workflow guide.
2. Add release-boundary slicing guidance to the release process.
3. Update stale release facts while editing the release process so the docs
   point at `v6.0.0` as the next shaping lane.
4. Keep the v6 backlog lane linked to this pulled cycle.

## Tests / validation

- `npm run docs:inventory`
- `git diff --check`
- `npm run lint`

## Retrospective

Closed by documenting PR slicing thresholds in the workflow guide, adding
release-boundary sizing rules to the release process, and updating stale
release posture from `v5.0.0` to `v6.0.0`.
