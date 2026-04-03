# Bijou Workflow

_The repo-local workflow summary for Bijou's METHOD adoption_

For doctrine, read [METHOD.md](./METHOD.md). This file is the short
operator summary.
For release mechanics, read [release.md](./release.md).

## Current Surfaces

Bijou now tracks work through:

- **Legends**
  - [`docs/legends/`](./legends/README.md)
  - named long-lived work domains
- **Cycles**
  - [`docs/design/`](./design/README.md)
  - active and landed cycle docs
- [`docs/BACKLOG/`](./BACKLOG/README.md)
  - lane-based backlog and untriaged historical captures
- [`docs/BEARING.md`](./BEARING.md)
  - current direction and tensions
- [`docs/VISION.md`](./VISION.md)
  - bounded executive synthesis
- [`docs/CHANGELOG.md`](./CHANGELOG.md)
  - merged or shipped behavior truth
- `tests/cycles/<cycle>/`
  - cycle-owned executable proof

## Working Loop

1. Pull from `docs/BACKLOG/asap/` or `docs/BACKLOG/up-next/`.
2. Move the file into `docs/design/` and enrich it into a real cycle doc.
3. Write failing tests. Playback questions become the executable spec.
4. Green the tests.
5. Record witness material when needed.
6. Close honestly: retrospective, drift notes, and follow-on backlog.
7. After merge, sync `BEARING.md`, `CHANGELOG.md`, and any other
   signposts that changed.

## Repo Rules

- `docs/specs/` remains a legacy/reference surface for older artifacts.
- `docs/ROADMAP.md` is reference, not the current queue.
- `docs/PLAN.md` is a narrative summary, not the source of truth.
- Legends, cycle docs, tests, and backlog placement must agree.
- Agents are first-class users and should have explicit hills and
  playback questions where relevant.

## Read Order

For current truth, start at [docs/README.md](./README.md), then read:

1. [METHOD.md](./METHOD.md)
2. [BEARING.md](./BEARING.md)
3. the relevant [Legend](./legends/README.md)
4. the relevant backlog lane or cycle doc
5. [CHANGELOG.md](./CHANGELOG.md) if shipped behavior matters
