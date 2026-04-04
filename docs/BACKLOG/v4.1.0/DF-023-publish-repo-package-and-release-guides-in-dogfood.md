# DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD

Legend: [DF — DOGFOOD Field Guide](../../legends/DF-dogfood-field-guide.md)

## Idea

DOGFOOD should expose Bijou's repo-facing and package-facing guidance in
the terminal, not only component stories.

That minimum corpus should include:

- repo orientation / start-here guidance
- package-level explanations for the shipped workspace packages
- release and migration guidance relevant to the current line

## Why

Users evaluating Bijou need answers to:

- what packages exist?
- what is each one for?
- where do I start?
- what changed in this release line?

Those answers already exist in the repo, but DOGFOOD does not yet carry
them.

## Ready when

- DOGFOOD exposes a visible Start Here / Packages / Release-style path
- the main shipped packages have explainer pages inside DOGFOOD
- release and migration guides relevant to `4.1.0` are reachable inside
  the docs app

## Status

`4.1.0` blocker spawned by
[DF-021](../../design/DF-021-shape-dogfood-as-terminal-docs-system.md).
