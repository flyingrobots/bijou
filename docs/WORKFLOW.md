# Bijou Workflow

_The project planning and delivery model for Bijou_

## Planning model

Bijou now plans work through:

- **Legends**
  - broad thematic efforts such as Humane Terminal or Localization and Bidirectionality
- **Cycles**
  - short implementation/design loops focused on one deliverable
- **Backlog items**
  - single-file work items that can be rough, partial, or speculative
- **Invariants**
  - project-wide truths that design and implementation are not allowed to violate

## Directory model

- `docs/legends/`
  - one document per legend
- `docs/BACKLOG/`
  - one file per backlog item
- `docs/design/`
  - active and landed cycle design docs
- `docs/invariants/`
  - explicit project-wide invariants
- `tests/cycles/<cycle>/`
  - cycle-owned playback/regression/spec tests

`docs/specs/` is now a **legacy directory**. Existing files may remain until touched, but new planning work should not start there.

## Naming conventions

### Backlog items

Backlog items are named:

`<Legend code>-<numerical identifier>-<name>.md`

Example:

`HT-001-establish-workflow.md`

### Cycle docs

Cycle docs use the same code and live in `docs/design/`.

When a cycle begins:

1. pick a backlog item
2. move that file into `docs/design/`
3. enrich it with the information required to implement the cycle

### Cycle tests

Cycle-owned tests live under:

`tests/cycles/<cycle>/`

Package-local unit tests can still live in the normal package test locations.

## Required design sections

Every active cycle design doc should include:

- linked legend
- human users / jobs / hills
- agent users / jobs / hills
- human playback
- agent playback
- linked invariants
- implementation outline
- tests to write first
- risks / unknowns
- retrospective

## Cycle workflow

1. Design docs first, using IBM Design Thinking.
2. Tests are the spec. Write failing tests first.
3. Green the tests.
4. Run playbacks.
5. Write a retrospective and assess drift.
6. Update `docs/BACKLOG/` with debt and follow-on ideas.
7. Update `docs/CHANGELOG.md`.
8. Iterate through PR review until accepted.
9. Merge and sync.
10. Bump version / cut release if needed.
11. Triage the backlog and pick the next cycle.

## Process rules

- No new milestone planning.
- No new `docs/specs/*` planning artifacts for fresh work.
- Legends deserve their own docs and should be linked when referenced.
- Important project-wide invariants must be documented explicitly and linked when referenced.
- Agents are first-class users and get their own design pass, playbacks, and hills.

## Relationship to existing docs

For the current docs entrypoint and "read this first" order, start at [docs/README.md](./README.md).

Some older documents still reflect the previous planning model:

- `docs/ROADMAP.md`
- `docs/specs/`
- parts of `docs/strategy/`

Those are now migration surfaces, not the source of truth for new work.
