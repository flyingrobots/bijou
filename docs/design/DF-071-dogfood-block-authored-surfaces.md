# DF-071 - DOGFOOD Block-Authored Surfaces

Linked legend: [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Sponsor Human

DOGFOOD should increasingly feel like an app authored from semantic Blocks, not
an app that has a Blocks documentation page on the side.

## Sponsor Agent

An agent should be able to inspect DOGFOOD's product surfaces and understand
which Block owns each semantic region without executing provider lifecycle,
hidden registries, or view mutation paths.

## Hill

DOGFOOD uses Blocks for visible app semantics across shell, docs, preview,
settings, and workbench surfaces while preserving the existing component layer
as the leaf rendering vocabulary.

DF-071 is not a visual redesign. It is a product-boundary pass: more visible
DOGFOOD surfaces should be described, rendered, and verified through Blocks
where the Block boundary is already stable.

## Core Rule

Blocks own product semantics.

Components own leaf rendering.

Runtime and provider systems own lifecycle.

Localization owns text lookup through a port.

DF-071 may connect these layers, but it must not collapse them.

## Fifteen-Slice Plan

1. Refresh BEARING after DF-070 landed.
2. Land this design checkpoint.
3. Add missing block-authored surface coverage for shell footer/status hints.
4. Route docs footer hint text through the footer/status Block.
5. Add block-authored landing/title behavior proof.
6. Route the landing DOGFOOD panel through `TitleScreenBlock` data.
7. Add block-authored page chrome coverage for top navigation.
8. Route top-level docs page labels through a semantic nav Block seam.
9. Add block-authored search surface coverage.
10. Route search chrome text through the search Block seam without changing
    search mechanics.
11. Add block-authored article fallback coverage for missing docs.
12. Route missing-doc fallback through `DocumentationArticleBlock`.
13. Add block registry/product coverage for the new semantic surfaces.
14. Update docs and changelog with the shipped public DOGFOOD surface posture.
15. Run full validation, push, and open a PR.

The plan can adapt if the code reveals a cleaner seam, but each slice must keep
the same separation of concerns.

## Non-Goals

- no new provider lifecycle system
- no command dispatch rewrite
- no hidden global block registry
- no localization runtime rewrite
- no conversion of leaf components into Blocks
- no broad visual redesign
- no metadata-only tests standing in for rendered behavior

## Tests To Write First

- behavior tests proving routed surfaces render the user-visible text they claim
  to own
- behavior tests proving block registries expose the new semantic surfaces
  without discovery-time rendering
- behavior tests proving routed surfaces still preserve lowered-mode behavior
- behavior tests proving localization access stays behind the existing port

## Retrospective

Not started.
