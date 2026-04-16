# WF-001 — Adopt the Legends/Cycles Workflow

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Why this cycle exists

Bijou has been mixing multiple planning models:

- roadmap milestones
- strategy notes
- specs
- ad hoc backlog capture

That makes it harder for both humans and agents to tell:

- what is active
- what is backlog
- where design truth lives
- where tests tied to a cycle should go

This cycle establishes the workflow itself as a first-class repo artifact.

## Human users

### Primary human user

A maintainer or contributor who needs to:

- capture ideas
- pick the next piece of work
- understand active design intent
- see what tests belong to a cycle
- record debt and follow-on work honestly

### Human hill

A human maintainer can open the repo and understand:

- what a legend is
- what a cycle is
- where backlog items live
- where active design docs live
- where cycle-specific tests live

without reverse-engineering tribal process from old roadmap prose.

## Agent users

### Primary agent user

A coding/design agent working inside the repo who needs to:

- discover the current planning model quickly
- know where to place new design docs
- know where to place cycle-owned tests
- know which invariants must be linked and protected
- know how to spawn backlog debt instead of silently drifting

### Agent hill

An agent can enter the repo and, with minimal context, place design, tests, backlog fallout, and changelog updates in the right locations without reinforcing the old `strategy/specs/roadmap` drift.

## Human playback

1. A maintainer has a new idea.
2. They create one file in `docs/method/backlog/`.
3. They decide to start the work.
4. They move that file into `docs/design/`.
5. They enrich the cycle doc with hills, playbacks, invariants, and test intent.
6. They write failing tests under `tests/cycles/WF-001/` or the relevant cycle directory.
7. They land the work.
8. They record drift and spin out any debt into fresh backlog items.

## Agent playback

1. An agent reads [Bijou Workflow](../WORKFLOW.md).
2. The agent finds the relevant legend doc.
3. The agent checks linked invariants.
4. The agent discovers the active cycle doc in `docs/design/`.
5. The agent writes or updates cycle-owned tests in `tests/cycles/<cycle>/`.
6. The agent lands the change and records retrospective fallout as backlog files.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Shell Owns Shell Concerns](../invariants/shell-owns-shell-concerns.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Deliverables

- add `docs/method/backlog/`
- add `docs/design/`
- add `docs/legends/`
- add `docs/invariants/`
- add a canonical workflow doc
- add legend docs
- add invariant docs
- add cycle test support in `tests/cycles/`
- mark `docs/specs/` as legacy/frozen for new work
- capture the current i18n package split as a backlog item instead of a fresh spec pair

## Tests to write first

- a cycle-owned test proving the new directories/docs exist
- a cycle-owned test proving the workflow doc documents Legends/Cycles and `tests/cycles/<cycle>/`
- a cycle-owned test proving core legend and invariant docs exist
- a cycle-owned test proving the i18n package-split idea is now backlog work instead of new spec work

## Risks

- partially adopting the workflow while continuing to add new work to `docs/specs/`
- leaving the old roadmap as if it were still the active source of truth
- documenting the workflow without updating the test harness to discover `tests/cycles/`

## Retrospective

### What landed

- the repo now has explicit workflow, legend, invariant, backlog, and design-cycle surfaces
- cycle-owned tests now have an official home in `tests/cycles/`
- the just-added i18n package-boundary planning work was rehomed as backlog instead of living as fresh spec files
- `docs/specs/` is now explicitly marked as legacy for new work

### Drift from ideal

- `docs/ROADMAP.md` still exists as a large legacy planning artifact
- older `docs/strategy/*` notes still need a deliberate migration story
- historical spec files remain and are not converted in this cycle

### Debt spawned

- [WF-002 — Migrate Legacy Planning Artifacts](../method/retro/WF_002-migrate-legacy-planning-artifacts.md)
