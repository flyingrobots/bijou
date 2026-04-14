---
title: WF-008 — METHOD backlog helper generates malformed note filenames
legend: WF
lane: graveyard
---

# WF-008 — METHOD backlog helper generates malformed note filenames

## Disposition

Out of scope for Bijou. The malformed filename generation behavior belongs to the METHOD tooling in ~/git/method, not to this repository's product or workflow backlog.

## Original Proposal

The METHOD backlog creation helper currently emits malformed filenames like `DX_dx-022-layout-inspector-overlay.md` and `DF_df-028-story-capture-matrix.md` instead of the repo's canonical `DX-022-...` / `DF-028-...` pattern.

## Why this is bad-code

- every newly added note has to be manually renamed after creation
- it makes the filesystem less trustworthy than the title/frontmatter
- it introduces needless churn into otherwise simple backlog-add flows
- it risks broken expectations for scripts or humans relying on the ID-first filename convention

## Evidence

This occurred repeatedly during the current `release/v5.0.0` backlog shaping pass when creating new METHOD notes in `cool-ideas/`.

## Expected behavior

The helper should derive filenames directly from the normalized backlog ID and slug, matching existing repo convention:

- `DX-022-layout-inspector-overlay.md`
- `DF-028-story-capture-matrix.md`
- `RE-024-surface-budget-warnings.md`

## Fix direction

Normalize filename generation inside the METHOD helper so legend prefixes and numeric IDs are not duplicated or lowercased into the stem.
