# WF-123 - Issues-First Method Intake

Linked issues: #123, #124, #153

Linked legend: [WF - Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor Human

A Bijou maintainer or contributor who needs to propose, triage, and follow
work without learning the historical filesystem backlog first.

## Sponsor Agent

A Method bookkeeping agent that must keep GitHub Issues, labels, design docs,
witness evidence, retros, changelog notes, and PR closure references aligned.

## Hill

Bijou uses GitHub Issues as the live work tracker while keeping repository docs
as the durable evidence ledger for designs, witnesses, retros, and shipped
history.

## Why This Cycle Exists

The deep-dive audit found that the old backlog-first docs made Day 0
contributors and agents read historical planning files before they could tell
where active work lives. The Method direction has changed: raw intake belongs
in GitHub Issues, and labels carry live tracker state.

Bijou should follow that model without deleting historical evidence.

## Playback Questions

1. Can a contributor open one GitHub issue and understand which labels describe
   lane, type, priority, and legend?
2. Can a maintainer see that `docs/method/backlog/`, `retro/`, and
   `graveyard/` are evidence and archive surfaces, not the first intake path?
3. Can an agent distinguish live issue state from historical repo files during
   context recovery?
4. Can a PR still point to design, witness, retro, changelog, and issue
   evidence after implementation work lands?

## Accessibility / Assistive Reading Posture

The guidance must remain plain Markdown with short tables and direct issue
template references. The important reader task is deciding where to open or
triage work, not parsing a process essay.

## Localization / Directionality Posture

This is repository workflow documentation. No runtime localization behavior
changes.

## Agent Inspectability / Explainability Posture

The live state is inspectable through GitHub issue labels. Repo files remain
inspectable evidence:

- `docs/design/` for shaped cycle intent
- PR descriptions and comments for witness output
- `docs/method/retro/` for landed or otherwise closed lineage
- `docs/CHANGELOG.md` for shipped behavior

## Linked Invariants

- Live tracker state must not fork between local backlog files and GitHub
  Issues.
- Historical evidence must not be deleted merely because it is no longer live
  work.
- Labels are tracker metadata; issue body and PR evidence carry the narrative.

## Implementation Outline

1. Replace contributor intake guidance with GitHub Issues-first wording.
2. Document lane labels and the `work-in-progress` state label.
3. Reframe `docs/method/backlog/` as a compatibility/evidence ledger unless a
   release lane explicitly says otherwise.
4. Clarify retro and graveyard search posture.
5. Keep issue forms aligned with the Method card shape.

## Tests To Write First

This cycle is documentation and template work. Verification is:

- `npm run docs:inventory`
- `git diff --check`
- issue template YAML parsing
- focused docs preview tests when front-door docs change

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
