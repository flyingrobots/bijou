# Backlog

This directory is the source of truth for proposed work that has **not**
started yet.

Bijou now uses METHOD-style lanes inside the backlog:

- [`inbox/`](./inbox/README.md)
- [`asap/`](./asap/README.md)
- [`up-next/`](./up-next/README.md)
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
