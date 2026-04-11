# Backlog

This directory is the source of truth for proposed work that has **not**
started yet.

Bijou now uses METHOD-style lanes inside the backlog:

- [`inbox/`](./inbox/README.md)
- [`asap/`](./asap/README.md)
- [`up-next/`](./up-next/README.md)
- `vX.Y.Z/` when a shaped release still has cycle-shaped blockers
- [`cool-ideas/`](./cool-ideas/README.md)
- [`bad-code/`](./bad-code/README.md)

## Rules

- one file per backlog item
- filename format stays `<LEGEND>-<id>-<slug>.md`
- when a cycle starts, move the file into `docs/design/`
- the root of `docs/BACKLOG/` is reserved for untriaged, legacy, or
  historical backlog captures that have not yet been re-laned

If a file looks like current work, it should usually live in `asap/` or
`up-next/`, not only in the root backlog.

Version-target lanes like `v4.1.0/` are temporary. Use them only for
cycles that must close before that release ships, including cases where
release posture, docs-surface truth, and validation still disagree.

Active version-target release lanes:

- [`v4.5.0/`](./v4.5.0/README.md) — hardening: input validation, i18n catalog loader, DOGFOOD depth
- [`v5.0.0/`](./v5.0.0/README.md) — frame owns the pump, layout formalization, scrollbar upstreaming
