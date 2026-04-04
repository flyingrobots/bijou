# METHOD

A backlog, a loop, and honest bookkeeping, adapted to how Bijou already works.

## Principles

### Stances

**The agent and the human sit at the same table.** They see different
things. Both matter. Both should be legible in the design of the work.

**Default to building the agent surface first.** If a surface is meant
to be inspectable, replayable, or codable by an agent, that should be
explicit in the cycle doc and the tests.

**The filesystem is the coordination layer.** A directory is a
priority. A filename is an identity. Moving a file is a decision.

**Process should be calm.** No sprints. No velocity theater. Bijou
tracks work through backlog lanes, cycle docs, tests, changelog truth,
and a small set of signposts.

### Quality gates

**Everything traces to a playback question.** If you cannot say which
question the work answers, you are drifting.

**Tests are the executable spec.** Design names the hill and the
playback questions. Tests prove the answers.

**If a claimed result cannot be reproduced, it is not done.** Witnesses
are rerunnable proof, not victory photos.

## Bijou Adaptations

Bijou is adopting METHOD without pretending it started there from day
one. The repo keeps a few established conventions:

- the public [README](../README.md) stays the package front door rather
  than becoming a pure process signpost
- the process doctrine lives here in `docs/METHOD.md`
- backlog and cycle files keep Bijou's existing
  `<LEGEND>-<id>-<slug>.md` naming
- cycle docs stay as flat files under `docs/design/` rather than
  `design/<cycle>/<task>.md`
- historical cycles may keep retros inline in the cycle doc; new
  supplemental retros or witness packets can live under `docs/retro/`
  when that adds real value

This is deliberate. The METHOD discipline matters more than copying the
template filesystem literally.

Bijou now also standardizes cycle branch naming and merge posture:

- active cycle work must happen on a branch named
  `cycle/<cycle_name>`
- `<cycle_name>` should match the cycle doc identity without the `.md`
  suffix, for example
  `cycle/RE-007-migrate-framed-shell-onto-runtime-engine-seams`
- when the cycle is complete, including its retrospective, push that
  branch and open a pull request to `main`

## Structure

```text
docs/
  METHOD.md                        process doctrine for repo work
  BEARING.md                       current direction, latest merged work, tensions
  VISION.md                        bounded executive synthesis
  BACKLOG/
    inbox/                         raw ideas
    asap/                          pull soon
    up-next/                       next in line
    vX.Y.Z/                        temporary release-blocking lane when needed
    cool-ideas/                    experiments and optional bets
    bad-code/                      debt that bothers us
    *.md                           untriaged or historical backlog captures
    README.md
  legends/                         named domains
  design/                          active and landed cycle docs
  retro/                           supplemental retros and witness packets
  graveyard/                       deliberately rejected work
  release.md                       repo-native release process
  CHANGELOG.md                     ship-facing truth
  PLAN.md                          short narrative summary of current posture
  ROADMAP.md                       broad legacy/reference surface
```

## Signposts

Bijou's bounded signposts are:

| Signpost | Role |
|----------|------|
| [`README.md`](../README.md) | Public front door: package map, positioning, and docs entrypoints. |
| [`docs/METHOD.md`](./METHOD.md) | Repo work doctrine and tracking model. |
| [`docs/BEARING.md`](./BEARING.md) | Current direction, latest merged work, and tensions. |
| [`docs/VISION.md`](./VISION.md) | Bounded synthesis of what Bijou is trying to become. |
| [`docs/CHANGELOG.md`](./CHANGELOG.md) | Shipped or merged behavior truth. |

`PLAN.md` is a narrative summary, not the authority. The authority is
the combined repo state of backlog lanes, design docs, tests, changelog,
and signposts.

## Backlog

Backlog items are markdown files. The filesystem is the queue.

### Lanes

| Lane | Purpose |
|------|---------|
| `inbox/` | Raw ideas. Capture first, sort later. |
| `asap/` | Pull into a cycle soon. |
| `up-next/` | Next in line once `asap/` clears. |
| `vX.Y.Z/` | Temporary lane for cycles that must close before that shaped release ships. |
| `cool-ideas/` | Interesting, not committed. |
| `bad-code/` | Debt that works but bothers us. |

Anything in the root of `docs/BACKLOG/` is either:

- not yet triaged into a lane
- intentionally kept as historical backlog lineage
- waiting for explicit re-triage under the newer METHOD posture

### Naming

Bijou keeps its established naming:

```text
RE-007-migrate-framed-shell-onto-runtime-engine-seams.md
DX-004-smooth-surface-and-string-composition-seams.md
DF-020-deepen-dogfood-story-depth-and-variant-quality.md
```

### Promotion

When a backlog item is pulled into a cycle, it moves into `docs/design/`
and stops living in the active backlog.

### Maintenance

At cycle boundaries:

- process `inbox/`
- move the truly current work into `asap/` and `up-next/`
- create or prune version-target lanes like `vX.Y.Z/` only when a
  shaped release has genuine remaining blockers
- push stale but still valid work back to root backlog or `cool-ideas/`
- file irritating debt in `bad-code/`
- move rejected work into `docs/graveyard/`

Do not let `PLAN.md` substitute for this filesystem work.

## Legends

Legends are long-lived domains, not milestones. They organize attention
across many cycles. Each legend should say:

- what domain it covers
- who the human users are
- who the agent users are
- the human and agent hills
- the core invariants
- the latest completed cycle
- the live backlog that still matters

## Cycles

A cycle is a unit of shipped work. Bijou keeps cycle docs in
`docs/design/`.

### Required sections

Every modern cycle doc should name:

- sponsor human
- sponsor agent
- hill
- playback questions
- accessibility / assistive reading posture
- localization / directionality posture
- agent inspectability / explainability posture
- non-goals

If a posture does not matter, say so explicitly.

### The loop

1. Pull from `docs/BACKLOG/asap/` or `docs/BACKLOG/up-next/`.
2. Create a branch named `cycle/<cycle_name>` for that cycle work.
3. Move the item into `docs/design/` and enrich it.
4. Write failing tests. Playback questions become specs.
5. Make the tests pass.
6. Produce witness material when the hill needs it.
7. Close the cycle honestly, including drift notes, retrospective, and
   follow-on debt.
8. Push the cycle branch and open a pull request to `main`.
9. After merge on `main`, sync signposts such as `BEARING.md` and
   `CHANGELOG.md`.

## Coordination

Bijou does not need process theater if the repo answers these questions:

- What is next? `ls docs/BACKLOG/asap`
- What is queued after that? `ls docs/BACKLOG/up-next`
- What must close before the current shaped release? inspect
  `docs/BACKLOG/vX.Y.Z/` if it exists; otherwise there are no
  cycle-shaped release blockers
- What is actively or historically committed? `ls docs/design`
- What shipped? read `docs/CHANGELOG.md`
- What direction are we steering? read `docs/BEARING.md`

If those answers are unclear, fix the docs and filesystem rather than
adding ceremony.

## Flow

```text
idea -> BACKLOG/inbox
  -> BACKLOG/asap | BACKLOG/up-next | BACKLOG/vX.Y.Z | BACKLOG/cool-ideas | BACKLOG/bad-code
  -> cycle/<cycle_name>
  -> design/<cycle-doc>.md
  -> RED -> GREEN -> playback
  -> retro/ or inline retrospective
  -> push cycle/<cycle_name> -> PR -> main
  -> BEARING / CHANGELOG / release sync when relevant
      - or ->
  -> graveyard/
```

## Tooling

Bijou does not yet ship a dedicated METHOD CLI. The repo-native queries
are filesystem and docs based:

```bash
ls docs/BACKLOG/asap
ls docs/BACKLOG/up-next
ls docs/design
npm test
```

DOGFOOD remains the main proving surface for human-facing shell and
documentation claims. `tests/cycles/*` remains the main place where
cycle truth becomes executable.

## What This Does Not Add

No milestones. No velocity. No ticket dashboard requirement. No meeting
ritual by default.

METHOD in Bijou means honest backlog lanes, honest cycle docs, honest
tests, and honest ship sync.
