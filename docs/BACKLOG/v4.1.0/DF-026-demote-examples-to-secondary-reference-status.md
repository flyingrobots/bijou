# DF-026 — Demote Examples To Secondary Reference Status

Legend: [DF — DOGFOOD Field Guide](../../legends/DF-dogfood-field-guide.md)

## Idea

Bijou should stop presenting the `examples/` tree as a competing public
docs surface.

Examples may remain in the repo, but for `4.1.0` they should read as:

- secondary reference inventory
- migration/reference fixtures
- isolated API seam proofs
- regression and smoke substrate

not as the primary way humans are expected to learn Bijou.

## Why

If the root docs still route humans through example indexes and example
READMEs as if those were the product surface, then DOGFOOD is still only
"an example with ambition."

This blocker exists to make the public-docs posture honest before the
release ships.

## Ready when

- front-door docs treat DOGFOOD as the canonical learning path
- the example inventory is explicitly marked secondary/internal
- release-facing docs stop presenting example indexes as equal public
  docs navigation
- remaining example reference value is described as migration,
  regression, or targeted API proof rather than general-product docs

## Status

`4.1.0` blocker spawned by
[DF-025](../../design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md).
