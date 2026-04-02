# WF-003 — Replace `smoke:examples:*` With `smoke:dogfood`

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Idea

The repo still treats the broad `examples/` tree as a release-facing smoke surface.

That made sense while examples were the main canonical teaching and proving layer, but DOGFOOD now exists specifically to reduce drift between:

- docs
- demos
- examples
- tests

This cycle would replace the current `smoke:examples:*` family with a DOGFOOD-centered smoke path such as `smoke:dogfood`, and then narrow the remaining example suite to only the examples that still serve a unique canonical or migration role.

## Why

Right now the repo is carrying two competing proving surfaces:

- DOGFOOD as the intended living-docs and story substrate
- the full examples tree as a release gate

That split works against the post-v4 direction.

If DOGFOOD is the canonical teaching surface, release smoke should gradually move there too. Otherwise the repo keeps paying to maintain example breadth even after the product direction has shifted toward stories, docs, and shared scenario truth.

This should also make future example deletion or consolidation safer because the release contract would no longer depend on broad example sprawl by default.

## Notes

- Do not delete canonical runtime reference examples until DOGFOOD or another targeted smoke path fully replaces their proving role.
- Keep migration/reference examples that public docs still point to until those docs are rewritten.
- Prefer a staged transition:
  - add `smoke:dogfood`
  - move release/readiness gates onto it
  - then decide which examples remain canonical and which can be retired

## Status

Backlog spawned from post-v4 DOGFOOD consolidation discussion.
