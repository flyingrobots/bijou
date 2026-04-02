# Git Rules

- NEVER amend commits
- NEVER rebase
- NEVER force any git operation
- Do not push to `main` without explicit permission

# Documentation And Planning Map

## Read These First

When recovering context or auditing the repo's current truth:

1. `docs/README.md`
   - documentation entrypoint and source-of-truth map
2. `README.md`
   - public front door: package map, DOGFOOD overview, quick start
3. `docs/PLAN.md`
   - current execution order
4. relevant `docs/legends/*`, `docs/BACKLOG/*`, and `docs/design/*`
   - thematic intent, not-started work, and active/landed cycle detail
5. `docs/CHANGELOG.md`
   - shipped changes and notable repo-facing behavior shifts

## Current Truth Surfaces

| Path | Purpose |
|------|---------|
| `docs/README.md` | docs entrypoint and source-of-truth map |
| `docs/PLAN.md` | shortest honest answer to "what is next?" |
| `docs/legends/` | thematic workstreams |
| `docs/BACKLOG/` | not-started work |
| `docs/design/` | active and landed cycle design docs |
| `docs/invariants/` | project-wide truths |
| `docs/CHANGELOG.md` | shipped changes |
| `examples/docs/README.md` | DOGFOOD proving surface |

## Reference And Historical Surfaces

These still matter, but they are not the main execution truth:

| Path | Role |
|------|------|
| `docs/ARCHITECTURE.md` | current structural reference |
| `docs/MIGRATING_TO_V4.md` | release-line migration guide |
| `docs/EXAMPLES.md` | curated canonical-example map |
| `docs/ROADMAP.md` | broad legacy/reference surface |
| `docs/COMPLETED.md` | shipped milestone archive |
| `docs/GRAVEYARD.md` | explicitly abandoned ideas |
| `docs/specs/` | frozen legacy planning artifacts |
| `docs/archive/` | exploratory and historical docs that should not read like front-door guidance |

## Context Recovery Protocol

When starting a new session or recovering from context loss:

1. Read `docs/README.md`.
2. Read `docs/PLAN.md`.
3. Read the relevant legend, backlog item, and design doc.
4. Read the latest relevant section of `docs/CHANGELOG.md`.
5. Check `git log --oneline -10` and `git status`.

Do not assume `docs/ROADMAP.md` is the active source of truth for current work.

# End Of Turn Checklist

At the end of a turn that alters files:

1. Update documentation when it changed materially.
2. Update `docs/CHANGELOG.md` if the change is repo-facing enough to belong there.
3. Add follow-on backlog debt if something real was deferred.
4. Commit focused changes with a conventional message.
