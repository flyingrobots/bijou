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
- [`docs/method/backlog/`](./method/backlog/README.md)
  - canonical live backlog lanes and shaped release lanes
- [`docs/BEARING.md`](./BEARING.md)
  - current direction and tensions
- [`docs/VISION.md`](./VISION.md)
  - bounded executive synthesis
- [`docs/CHANGELOG.md`](./CHANGELOG.md)
  - merged or shipped behavior truth
- `tests/cycles/<cycle>/`
  - cycle-owned executable proof

## Working Loop

1. Pull from `docs/method/backlog/asap/` or `docs/method/backlog/up-next/`.
2. Create a branch named `cycle/<cycle_name>` for that cycle.
3. Move the file into `docs/design/` and enrich it into a real cycle doc.
4. Write failing tests. Playback questions become the executable spec.
5. Green the tests.
6. Record witness material when needed.
7. Close honestly: retrospective, drift notes, and follow-on backlog.
8. Push the cycle branch and open a pull request to `main`.
9. After merge, sync `BEARING.md`, `CHANGELOG.md`, and any other
   signposts that changed.

## Repo Rules

- `docs/specs/` remains a legacy/reference surface for older artifacts.
- `docs/ROADMAP.md` is reference, not the current queue.
- `docs/strategy/README.md` separates living doctrine from historical strategy notes.
- `docs/BEARING.md` is a direction summary, not the source of truth.
- Legends, cycle docs, tests, and backlog placement must agree.
- Agents are first-class users and should have explicit hills and
  playback questions where relevant.
- Version-target backlog lanes like `docs/method/backlog/vX.Y.Z/` are only for
  cycles that must land before that shaped release ships.

## Read Order

For current truth, start at [docs/README.md](./README.md), then read:

1. [METHOD.md](./METHOD.md)
2. [BEARING.md](./BEARING.md)
3. the relevant [Legend](./legends/README.md)
4. the relevant backlog lane or cycle doc
5. [CHANGELOG.md](./CHANGELOG.md) if shipped behavior matters
