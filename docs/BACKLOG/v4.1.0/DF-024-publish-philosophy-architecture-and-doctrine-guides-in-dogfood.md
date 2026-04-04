# DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD

Legend: [DF — DOGFOOD Field Guide](../../legends/DF-dogfood-field-guide.md)

## Idea

DOGFOOD should not stop at API and package guidance. It also needs to
carry the docs that explain why Bijou is shaped the way it is.

That minimum corpus should include:

- philosophy and doctrine docs
- architecture guidance
- the repo's larger design stance where it is part of understanding the
  framework

## Why

Bijou is not just a component library. Users and maintainers need to be
able to read:

- how runtime truth and portability are treated
- how the repo is architected
- what design/system doctrine the framework expects

Those docs exist today in `docs/`, but not in DOGFOOD.

## Ready when

- DOGFOOD exposes a visible Philosophy / Architecture-style section
- key doctrine and architecture pages are reachable from inside the docs
  app
- the release no longer implies that users must leave DOGFOOD to learn
  what Bijou believes about its own design

## Status

`4.1.0` blocker spawned by
[DF-021](../../design/DF-021-shape-dogfood-as-terminal-docs-system.md).
